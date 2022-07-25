#!/usr/bin/env node

const { WebClient, retryPolicies, LogLevel } = require( '@slack/web-api' );
const config = require( 'config' );
const slackClient = new WebClient( config.get( 'slack.token' ), {
	retryConfig: retryPolicies.rapidRetryPolicy,
	logLevel: LogLevel.ERROR,
} );
const slackChannel = config.get( 'slack.channel' );

( async function main() {
	// Find conversation with a specified channel `name`
	const channelId = await findChannelId( slackChannel );
	console.log( channelId );
	// Find a message in a channel
	await findMessageThread( channelId );
} )();

// Find conversation ID using the conversations.list method
//todo use pagination
async function findChannelId( name ) {
	let conversationId;
	try {
		// Call the conversations.list method using the built-in WebClient
		const result = await slackClient.conversations.list( {
			exclude_archived: true,
			limit: 500,
		} );

		console.log( result.channels.length );
		for ( const channel of result.channels ) {
			console.log( channel.name );
			if ( channel.name === name ) {
				conversationId = channel.id;

				// Print result
				console.log( 'Found conversation ID: ' + conversationId );
				// Break from for loop
				break;
			}
		}
	} catch ( error ) {
		console.error( error );
	}

	return conversationId;
}

async function findMessageThread( channelId ) {
	try {
		// Get the messages in the channel. It only returns parent messages in case of threads.
		// If the message has a `thread_ts` defined we have a thread
		// If `thread_ts === ts` we have a parent message
		const result = await slackClient.conversations.history( {
			channel: channelId,
			limit: 10,
		} );

		console.log( result.messages.length + ' messages found in ' + channelId );

		for ( const message of result.messages ) {
			// console.log((!message.thread_ts || message.thread_ts === message.ts) + ' -> ' + message.thread_ts + '|' + message.ts + ' - ' + new Date(message.ts * 1000) + ' - ' + JSON.stringify( message.metadata ));
			console.log( JSON.stringify( message.text ) );
		}
	} catch ( error ) {
		console.error( error );
	}
}
