const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Get user function called with:', JSON.stringify(event, null, 2));
    
    try {
        const userId = event.pathParameters?.userId;
        
        if (!userId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: true,
                    message: 'Missing userId parameter',
                    code: 'MISSING_USER_ID'
                })
            };
        }
        
        // Get user from DynamoDB
        const result = await dynamodb.send(new GetCommand({
            TableName: process.env.USER_TABLE_NAME,
            Key: { userId }
        }));
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: true,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                user: result.Item
            })
        };
        
    } catch (error) {
        console.error('Get user error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: true,
                message: 'Failed to retrieve user',
                code: 'INTERNAL_ERROR'
            })
        };
    }
};