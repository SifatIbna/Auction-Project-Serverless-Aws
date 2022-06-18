import AWS from 'aws-sdk';
import createError from 'http-errors';

import { getAuctionById } from './getAuction';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
    let updatedAuction;
    const {id} = event.pathParameters;
    const {amount} =JSON.parse(event.body);
    const {email} = event.requestContext.authorizer;

    const auction = await getAuctionById(id);

    // Bid Identity
    if(email === auction.seller){
        throw new createError.Forbidden(`You can not bid on your own auctions!`);
    }
    // avoid double bidding
    if(email === auction.highestBid.bidder){
        throw new createError.Forbidden(`you are already highest bidder`);
    }

    if(auction.status !== 'OPEN'){
        throw new createError.Forbidden(`Auction is Closed`)
    }

    if (amount <= auction.highestBid.amount){
        throw new createError.Forbidden(`Your Bid must be higher than ${auction.highestBid.amount}!`);
    }

    const params = {
        TableName:process.env.AUCTIONS_TABLE_NAME,
        Key:{id},
        ExpressionAttributeValues : {
            ':amount' : amount,
            ':bidder' : email
        },
        UpdateExpression: "set highestBid.amount = :amount, highestBid.bidder = :bidder",
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


