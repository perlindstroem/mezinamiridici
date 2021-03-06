const bcrypt = require('bcryptjs');
const mongo = require('../../utils/mongo.js');
const api = require('../../utils/api.js');
const auth = require('../../utils/authenticate');

module.exports = (app) => {
    app.options('/v1/resetPassword', auth.cors, () => {});

    app.post('/v1/resetPassword', auth.cors, async (req, res) => {
        console.log("resetPassword handler starts");
        const { resetPasswordToken, password } = req.body;
        if (!resetPasswordToken) {
            return api.sendBadRequest(res, api.createError("Missing token", "sign-in.auth-error"));
        }

        try {
            const dbClient = await mongo.connectToDatabase();
            console.log("Mongo connected");

            const user = await mongo.findUser(dbClient, {"resetPasswordToken": resetPasswordToken}, {projection: { auth: 1, "bio.nickname": 1}});
            console.log("User checks");
            if (!user) {
                console.log("User not found");
                return api.sendErrorForbidden(res, api.createError("Token not found", "sign-in.invalid-reset"));
            }

            const now = new Date();
            if (user.auth.reset.expires < now) {
                return api.sendErrorForbidden(res, api.createError("Invalid or expired web token", "sign-in.expired-reset"));
            }

            const query = prepareChangePasswordQuery(password, now);
            dbClient.db().collection("users").updateOne({_id: user._id}, query);
            console.log(`Password changed for user ${user.auth.email}`);

            user.auth.pwdTimestamp = now;
            const token = auth.createTokenFromUser(user);
            return api.sendRresponse(res, api.createResponse(token));
        } catch (err) {
            console.log("Request failed", err);
            return api.sendInternalError(res, api.createError('Failed to reset the password', "sign-in.something-went-wrong"));
        }
    })
};

const prepareChangePasswordQuery = (password, date) => {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    let query = { $set: { }, $unset: { } };
    query.$set['auth.pwdHash'] = passwordHash;
    query.$set['auth.pwdTimestamp'] = date;
    query.$unset['auth.reset'] = '';
    return query;
};
