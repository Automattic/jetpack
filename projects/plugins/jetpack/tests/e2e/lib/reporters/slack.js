/**
 * External dependencies
 */
import { readFileSync, createReadStream } from 'fs';
import { WebClient, ErrorCode } from '@slack/web-api';
import config from 'config';

const { GITHUB_EVENT_PATH, GITHUB_RUN_ID, GUTENBERG } = process.env;

export default class SlackReporter {
	constructor() {
		const token = config.get( 'slackToken' );
		this.webCli = new WebClient( token );
		this.runURL = `https://github.com/Automattic/jetpack/actions/runs/${ GITHUB_RUN_ID }`;
		this.runType =
			GUTENBERG === 'latest' ? 'with latest :gutenberg: plugin' : 'with no :gutenberg: plugin';

		this.conversationId = config.get( 'slackChannel' );
		this.ccBrbrr = 'cc <@U6NSPV1LY>';
		const event = JSON.parse( readFileSync( GITHUB_EVENT_PATH, 'utf8' ) );
		this.isPullRequest = !! event.pull_request;
		if ( this.isPullRequest ) {
			this.branchName = event.pull_request.head.ref;
			this.githubURL = event.pull_request.html_url;
		} else {
			this.branchName = event.ref.substr( 11 );
			this.githubURL = `https://github.com/Automattic/jetpack/tree/${ this.branchName }`;
		}
	}

	async sendSuccessMessage() {
		return await this.sendMessageToSlack( this.getSuccessMessage() );
	}
	async sendFailureMessage( failures ) {
		return await this.sendMessageToSlack( this.getResultMessage( failures.length ) );
	}

	createSection( text, type = 'mrkdwn' ) {
		return {
			type: 'section',
			text: {
				type,
				text,
			},
		};
	}

	getFailedTestMessage( { name, block, error } ) {
		let testFailure = '';
		if ( error.name || error.message ) {
			testFailure = error.name + ': ' + error.message;
		}
		const message = [
			this.createSection( `*TEST FAILED:*
*Test suite*: ${ block }
*Test case*: ${ name }
*Failure reason:* ${ testFailure }
*E2E action run:* ${ this.runURL }
*Github branch:* ${ this.branchName }
*Github URL:* ${ this.githubURL }` ),
		];
		return message;
	}

	getResultMessage( failureCount ) {
		let buildInfo = `*BUILD #${ GITHUB_RUN_ID } FAILED:*

*Type:* ${ this.runType }
*Total failures:* ${ failureCount }
*E2E action run:* ${ this.runURL }
*Github branch:* ${ this.branchName }`;

		buildInfo += this.isPullRequest ? `\n*Github PR URL:* ` : '\n*Github branch URL:* ';
		buildInfo += this.githubURL;

		const message = [
			this.createSection( buildInfo ),
			this.createSection( `Build details are threaded :thread:` ),
		];

		if ( this.branchName === 'master' ) {
			message.push( this.createSection( this.ccBrbrr ) );
		}

		return message;
	}

	getSuccessMessage() {
		let buildInfo = `*BUILD #${ GITHUB_RUN_ID } PASSED:*

*Type:* ${ this.runType }
*E2E action run:* ${ this.runURL }
*Github branch:* ${ this.branchName }`;

		buildInfo += this.isPullRequest ? `\n*Github PR URL:* ` : '\n*Github branch URL:* ';
		buildInfo += this.githubURL;

		const message = [ this.createSection( buildInfo ) ];
		return message;
	}

	async sendMessageToSlack( message, options = {} ) {
		const payload = Object.assign(
			{
				channel: this.conversationId,
				username: 'Gutenpack testbot',
				icon_emoji: ':gutenpack:',
			},
			options
		);

		if ( typeof message === 'string' ) {
			payload.text = message;
		} else {
			payload.blocks = message;
		}

		// For details, see: https://api.slack.com/methods/chat.postMessage
		return await this.sendRequestToSlack(
			async () => await this.webCli.chat.postMessage( payload )
		);
	}

	async sendSnippetToSlack( message, options = {} ) {
		const payload = Object.assign(
			{
				channels: this.conversationId,
				username: 'Gutenpack testbot',
				icon_emoji: ':gutenpack:',
				content: message,
			},
			options
		);

		return await this.sendRequestToSlack( async () => await this.webCli.files.upload( payload ) );
	}

	async sendFileToSlack( filePath, options = {} ) {
		const payload = Object.assign(
			{
				filename: filePath,
				file: createReadStream( filePath ),
				channels: this.conversationId,
			},
			options
		);

		// For details, see: https://api.slack.com/methods/files.upload
		return await this.sendRequestToSlack( async () => await this.webCli.files.upload( payload ) );
	}

	async sendRequestToSlack( fn ) {
		try {
			return await fn();
		} catch ( error ) {
			// Check the code property and log the response
			if (
				error.code === ErrorCode.PlatformError ||
				error.code === ErrorCode.RequestError ||
				error.code === ErrorCode.RateLimitedError ||
				error.code === ErrorCode.HTTPError
			) {
				console.log( error.data );
			} else {
				// Some other error, oh no!
				console.log(
					'The error occurred does not match an error we are checking for in this block.'
				);
				console.log( error );
			}
		}
	}
}
