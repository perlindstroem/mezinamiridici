const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generate = require('nanoid/generate');
const ses = new AWS.SES();
const mongo = require('../../utils/mongo.js');
const http = require('../../utils/http.js');
//             "Access-Control-Allow-Headers": "*",

exports.handler = (payload, context, callback) => {
    console.log("handler starts");
    if (payload.body === undefined || payload.body === null) {
        return http.sendRresponse(callback, {success: false, response: 'body is null'});
    }

    const {email, password, nickname, termsAndConditions, dataProcessing, emails} = JSON.parse(payload.body);
    let result = validateParameters(email, password, nickname, termsAndConditions, dataProcessing);
    if (! result.success) {
        return http.sendBadRequest(callback, result);
    }

    // This freezes node event loop when callback is invoked
    context.callbackWaitsForEmptyEventLoop = false;

    const verificationToken = generate('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
    mongo.connectToDatabase()
        .then(db => {
            console.log("Mongo connected");
            return insertUser(db, email, password, nickname, emails, verificationToken);
        })
        .then((err, data) => {
            if (data)
                console.log('data', data);
            sendVerificationEmail(email, verificationToken, (err, data) => {
                console.log("email sent");
                const token = jwt.sign({"userId": userId,"nickname": nickname}, process.env.JWT_SECRET, {expiresIn: '1m'});
                if (err) {
                    return http.sendInternalError(callback, err.Item);
                } else {
                    return http.sendCreated(callback, {token});
                }
            });
        })
        .catch(err => {
            console.log("Request failed", err);
            if (err.code === 11000) {
                console.log(err.keyValue); // 409 conflict
                return http.sendConflict(callback, {success: false, message: 'email or nickname already exists'});
            }
            return http.sendInternalError(callback, {success: false, message: 'email or nickname already exists'});
        });
};

function insertUser(dbClient, email, password, nickname, emails, verificationToken) {
    console.log("insertUser");
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date();
    let userDoc = {
        "_id" : mongo.generateId(8),
        "auth": {
            "email": email,
            "pwdHash": passwordHash,
            "verified": false,
            "verifyToken": verificationToken
        },
        "bio": {
            "nickname": nickname
        },
        "prefs": {
            "public": true
        },
        "consent": {
            "terms": now,
            "data": now
        }
    };
    if (emails) {
        userDoc.consent.email = now;
        userDoc.prefs.email.newsletter = true;
        userDoc.prefs.email.summary = "daily";
    }

    return dbClient.db().collection("users").insertOne(userDoc);
}

const sendVerificationEmail = (email, token, fn) => {
    const verificationLink = "https://www.mezinamiridici.cz/verify/" + token;
    ses.sendEmail({
        Source: "robot@mezinamiridici.cz",
        Destination: {ToAddresses: [email]},
        Message: {
            Subject: {Data: "Dokončení registrace"},
            Body: {
                Html: {
                    Data: '<html><head>'
                        + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
                        + '<title>"Dokončení registrace"</title>'
                        + '</head><body>'
                        + '<p><a href="' + verificationLink + '">Dokončit registraci</a>.</p>'
                        + '<p>Pokud odkaz nejde otevřít, zkopírujte následující text a vložte jej do prohlížeče: ' + verificationLink + '</p>'
                        + '</body></html>'
                }
            }
        }
    }, fn);
};

const validateParameters = (email, password, nickname, termsAndConditions, dataProcessing) => {
    let result = { "success": true };
    if (!termsAndConditions) {
        result.success = false;
        result.code = 1000;
        http.addValidationError(result, "termsAndConditions", "Missing consent");
    }
    if (!dataProcessing) {
        result.success = false;
        result.code = 1000;
        http.addValidationError(result, "dataProcessing", "Missing consent");
    }
    if (email === undefined) {
        result.success = false;
        result.code = 1000;
        http.addValidationError(result, "email", "Missing email");
    }
    if (email.indexOf("@") === -1 || email.indexOf(".") === -1 ) {
        result.success = false;
        result.code = 1001;
        http.addValidationError(result, "email", "Invalid email");
    }
    if (password === undefined) {
        result.success = false;
        result.code = 1000;
        http.addValidationError(result, "password", "Missing password");
    }
    if (password.length < 6 ) {
        result.success = false;
        result.code = 1001;
        http.addValidationError(result, "password", "Password too short");
    }
    if (nickname === undefined) {
        result.success = false;
        result.code = 1000;
        http.addValidationError(result, "nickname", "Missing nickname");
    }
    return result;
}