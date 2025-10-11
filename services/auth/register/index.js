const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Register function called with:', JSON.stringify(event, null, 2));
    
    try {
        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log('Parsed body:', JSON.stringify(body, null, 2));
        
        const { userId, email, fullName, preferences } = body;
        
        // Validate required fields
        if (!userId || !email || !fullName) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: true,
                    message: 'Missing required fields: userId, email, fullName',
                    code: 'MISSING_FIELDS'
                })
            };
        }
        
        // Check if user already exists
        const existingUser = await dynamodb.send(new QueryCommand({
            TableName: process.env.USER_TABLE_NAME,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }));
        
        if (existingUser.Items && existingUser.Items.length > 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: true,
                    message: 'User already exists',
                    code: 'USER_EXISTS'
                })
            };
        }
        
        // Create user profile
        const userProfile = {
            userId,
            email,
            fullName,
            preferences: preferences || {
                dietaryRestrictions: [],
                allergies: [],
                cuisinePreferences: [],
                cookingSkill: 'beginner',
                targetCalories: 2000,
                mealsPerDay: 3
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save to DynamoDB
        await dynamodb.send(new PutCommand({
            TableName: process.env.USER_TABLE_NAME,
            Item: userProfile,
            ConditionExpression: 'attribute_not_exists(userId)'
        }));
        
        console.log('User registered successfully:', userId);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                userId,
                message: 'User registered successfully',
                user: userProfile
            })
        };
        
    } catch (error) {
        console.error('Registration error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: true,
                message: 'Failed to register user',
                code: 'INTERNAL_ERROR'
            })
        };
    }
};