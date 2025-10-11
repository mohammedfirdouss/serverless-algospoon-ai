const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Update profile function called with:', JSON.stringify(event, null, 2));
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { userId, fullName, preferences } = body;
        
        if (!userId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: true,
                    message: 'Missing userId',
                    code: 'MISSING_USER_ID'
                })
            };
        }
        
        // Check if user exists
        const existingUser = await dynamodb.send(new GetCommand({
            TableName: process.env.USER_TABLE_NAME,
            Key: { userId }
        }));
        
        if (!existingUser.Item) {
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
        
        // Build update expression
        let updateExpression = 'SET updatedAt = :updatedAt';
        const expressionAttributeValues = {
            ':updatedAt': new Date().toISOString()
        };
        
        if (fullName) {
            updateExpression += ', fullName = :fullName';
            expressionAttributeValues[':fullName'] = fullName;
        }
        
        if (preferences) {
            updateExpression += ', preferences = :preferences';
            expressionAttributeValues[':preferences'] = {
                ...existingUser.Item.preferences,
                ...preferences
            };
        }
        
        // Update user profile
        const result = await dynamodb.send(new UpdateCommand({
            TableName: process.env.USER_TABLE_NAME,
            Key: { userId },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        }));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                message: 'Profile updated successfully',
                user: result.Attributes
            })
        };
        
    } catch (error) {
        console.error('Update profile error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: true,
                message: 'Failed to update profile',
                code: 'INTERNAL_ERROR'
            })
        };
    }
};