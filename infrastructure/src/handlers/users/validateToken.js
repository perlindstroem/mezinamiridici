const jwt = require('jsonwebtoken');
const mongo = require('../../utils/mongo.js');
const api = require('../../utils/api.js');
const auth = require('../../utils/authenticate');

module.exports = (app) => {
    app.options('/v1/validateToken', auth.cors, () => {});

    app.post('/v1/validateToken', auth.required, auth.cors, async (req, res) => {
        console.log("validateToken handler starts");

        try {
            const dbClient = await mongo.connectToDatabase();
            console.log("Mongo connected");

            const jwtData = req.identity;
            const user = await mongo.findUser(dbClient, { _id: jwtData.userId }, {projection: { auth: 1 }});
            console.log("User checks");
            if (!user) {
                console.log("User not found " + jwtData.userId);
                return api.sendErrorForbidden(res, api.createError("User does not exist", "sign-in.auth-error"));
            }

            if (Date.parse(jwtData.pwdTimestamp) < Date.parse(user.auth.pwdTimestamp)) {
                return api.sendErrorForbidden(res, api.createError("Obsolete password", "sign-in.obsolete-password"));
            }

            delete jwtData.exp;
            const token = jwt.sign(jwtData, process.env.JWT_SECRET, {expiresIn: '31d'});
            return api.sendRresponse(res, api.createResponse(token));
        } catch (err) {
            console.log("Request failed", err);
            return api.sendInternalError(res, api.createError('Failed to verify token', "generic.something-went-wrong"));
        }
    })
};
