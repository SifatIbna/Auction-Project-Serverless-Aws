import AWS from 'aws-sdk';
import createError from 'http-errors';

import { getAuctionById } from './getAuction';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
    let updatedAuction;
    const {id} = event.pathParameters;
    const {amount} =JSON.parse(event.body);

    const auction = await getAuctionById(id);
    console.log(amount);
    console.log(auction.highestBid.amount);
    if (amount <= auction.highestBid.amount){
        throw new createError.Forbidden(`Your Bid must be higher than ${auction.highestBid.amount}!`);
    }

    const params = {
        TableName:process.env.AUCTIONS_TABLE_NAME,
        Key:{id},
        ExpressionAttributeValues : {
            ':amount' : amount,
        },
        UpdateExpression: "set highestBid.amount = :amount",
        ReturnValues: 'ALL_NEW',
    };

    try{
        const result = await dynamodb.update(params).promise();
        updatedAuction = result.Attributes;
    }
    catch(error){
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };
}

export const handler = placeBid;


