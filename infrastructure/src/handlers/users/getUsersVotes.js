const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const responses = require('../../utils/responses.js');

const response = (status, body) => {
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=600"
        },
        "body": JSON.stringify(body.Items),
        "isBase64Encoded": false
    }
}

exports.handler = (payload, context, callback) => {
    const { userId } = payload.pathParameters;

    dynamodb.query({
        "TableName": "BUDUserVoteTable",
        "IndexName": "UsersVotesFromUserIdIndex",
        "KeyConditionExpression": "#userId = :userId",
        "ExpressionAttributeNames": {
            "#userId": "userId"
        },
        "ExpressionAttributeValues": {
            ":userId": userId
        },
        "ConsistentRead": false,
    }, (err, data) => {
        console.log(err);
        console.log(data);
        return err ? responses.INTERNAL_SERVER_ERROR_500(err, callback, response) : responses.OK_200(data, callback, response)
    });
};