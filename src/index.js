const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

// Initialize DynamoDB Client for Node.js 22
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const cognitoClient = new CognitoIdentityProviderClient({});

const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Cognito Post-Confirmation Trigger
 * Syncs the newly confirmed user data into DynamoDB
 */
exports.handler = async (event) => {
  console.log("Cognito Event Received:", JSON.stringify(event, null, 2));

  // Extract attributes from the Cognito event
  const { sub, email, name } = event.request.userAttributes;
  const userPoolId = event.userPoolId;
  const userName = event.userName;

  // Validate critical identity attributes
  if (!sub || !email) {
    console.error("Missing critical attributes: 'sub' or 'email'.");
    return event;
  }

  // Fallback for user name
  const finalName = name || email.split("@")[0] || "User";

  // Adding this new user as a subscriber

  try {
    try {
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: userName,
          GroupName: "subscribers",
        }),
      );
      console.log(`User ${email} added to group: subscribers`);
    } catch (error) {
      console.error("Error adding user to subscribers group", error.message);
    }

    // Single Table Design Item Structure
    // PK: USER#<id> | SK: PROFILE#<id>
    const userItem = {
      PK: `USER#${sub}`,
      SK: `PROFILE#${sub}`,
      type: "USER",
      id: sub,
      email: email,
      name: finalName,
      role: "subscriber",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
    };

    // Persist data using the Document Client (automatically handles JSON to Dynamo mapping)
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: userItem,
      }),
    );

    console.log(`Successfully indexed user in DynamoDB: ${email}`);
  } catch (error) {
    // Error handling with descriptive logging
    console.error("DynamoDB Sync Error:", error.message || error);

    // We return the event so the user confirmation is not blocked in Cognito
  }

  return event;
};
