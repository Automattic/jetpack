import inquirer from 'inquirer';
import open from 'open';
import { chalkJetpackGreen } from '../helpers/styling.js';

/**
 * Command definition for the feedback subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @returns {object} Yargs with the rsync commands defined.
 */
export function feedbackDefine( yargs ) {
	yargs.command(
		'feedback [type]',
		'Send feedback to the Jetpack team. Choose whether you want to report a bug report in the form of a GitHub issue, or share anonymous feedback privately.',
		yarg => {
			yarg.positional( 'type', {
				describe:
					'Type of feedback you want to post. Either "bug" to open a public GitHub issue, or "feedback" for anonymous private feedback.',
				type: 'string',
			} );
		},
		async argv => {
			await feedbackInit( argv );
		}
	);

	return yargs;
}

/**
 * Entry point for any feedback.
 * Prompt for a type of feedback, then collect the information and send it.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function feedbackInit( argv ) {
	argv = {
		type: '',
		...argv,
	};

	if ( argv.type === 'bug' ) {
		openGithubIssue( argv );
	} else if ( argv.type === 'feedback' ) {
		sendAnonymousFeedback( argv );
	} else {
		console.log( chalkJetpackGreen( 'Thank you for making that first step.' ) );

		// Prompt for the type of feedback.
		inquirer
			.prompt( [
				{
					type: 'list',
					name: 'type',
					message: 'What kind of feedback do you want to send?',
					choices: [
						{
							name: 'Publish a public bug report about one of our tools.',
							value: 'bug',
						},
						{
							name: 'Send anonymous feedback to the Jetpack team.',
							value: 'feedback',
						},
					],
				},
			] )
			.then( feedbackType => {
				if ( feedbackType.type === 'bug' ) {
					openGithubIssue();
				} else if ( feedbackType.type === 'feedback' ) {
					sendAnonymousFeedback();
				}
			} );
	}
}

/**
 * Prompt to open a GitHub issue. Opens the browser if the user confirms.
 */
function openGithubIssue() {
	inquirer
		.prompt( [
			{
				type: 'string',
				name: 'title',
				message:
					'Describe your issue in a few words. We will open a GitHub issue for you to fill in.',
			},
		] )
		.then( issueTitle => {
			if ( issueTitle.title ) {
				// Build a URL including the title from the prompt, encoded for use in a URL.
				const url = `https://github.com/Automattic/jetpack/issues/new?title=Jetpack+CLI:+${ encodeURIComponent(
					issueTitle.title
				) }&labels=Needs+triage%2C%5BType%5D+Bug%2C%5BTools%5D+Development+CLI%2C%5BPri%5D+Normal`;

				console.log(
					chalkJetpackGreen(
						`Thank you. We will open a GitHub issue for you, where you can add more information about the problem.\n
Thanks for helping make Jetpack better!`
					)
				);

				inquirer
					.prompt( [
						{
							type: 'confirm',
							name: 'submitIssue',
							default: false,
							message: 'Open GitHub issue?',
						},
					] )
					.then( confirmSubmit => {
						if ( confirmSubmit.submitIssue ) {
							open( url );
						} else {
							console.log( chalkJetpackGreen( 'Okay then. Another time maybe?' ) );
						}
					} );
			} else {
				console.log( chalkJetpackGreen( 'No issue title provided. Exiting.' ) );
			}
		} );
}

/**
 * Prompt to send anonymous feedback. Sends the feedback if the user confirms.
 */
function sendAnonymousFeedback() {
	inquirer
		.prompt( [
			{
				type: 'string',
				name: 'feedback',
				message:
					'Please share your feedback with us. We will send it anonymously to the Jetpack team.',
			},
		] )
		.then( feedback => {
			if ( feedback.feedback ) {
				console.log(
					chalkJetpackGreen(
						`Thank you. We will send your feedback to the Jetpack team.\n
Thanks for helping make Jetpack better!`
					)
				);
			}
		} );
}
