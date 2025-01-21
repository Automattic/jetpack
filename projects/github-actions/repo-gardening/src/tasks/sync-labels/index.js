const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const formatSlackMessage = require( '../../utils/slack/format-slack-message' );
const sendSlackMessage = require( '../../utils/slack/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Synchronize specific labels from a source repository to the current repository.
 * It synchronizes all [Type], [Feature], and [Feature Group] labels.
 *
 * This task is only triggered manually so far.
 * By default, we synchronize labels from the automattic/jetpack repo.
 *
 * This task can send 2 different types of Slack notifications:
 * - If an issue is determined as High or Blocker priority,
 * - If no priority is determined.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function syncLabels( payload, octokit ) {
	const {
		repository: {
			owner: { login: ownerLogin },
			name,
		},
	} = payload;

	const sourceRepo = getInput( 'labels_source_repo' );

	// If we do not know where to pull labels from, we cannot proceed.
	if ( ! sourceRepo ) {
		debug( 'sync-labels: No source repo provided. Skipping sync.' );
		return;
	}
	const [ , owner, repo ] = sourceRepo.match( /https:\/\/github\.com\/([^/]+)\/([^/]+)/ );
	if ( ! owner || ! repo ) {
		debug( 'sync-labels: Invalid source repo provided. Skipping sync.' );
		return;
	}

	const qualityChannel = getInput( 'slack_quality_channel' );
	if ( qualityChannel ) {
		const message = `Label sync has been triggered. Labels are being synced from ${ owner }/${ repo } to ${ ownerLogin }/${ name }.`;
		const slackMessageFormat = formatSlackMessage( payload, qualityChannel, message );
		await sendSlackMessage( message, qualityChannel, payload, slackMessageFormat );
	}

	// Get all labels from the source repo.
	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listLabelsForRepo, {
		owner,
		repo,
		per_page: 100,
	} ) ) {
		for ( const label of response.data ) {
			if ( ! label.name.match( /\[Type\]|\[Feature\]|\[Feature Group\]/ ) ) {
				continue;
			}

			debug( `sync-labels: adding "${ label.name }" label to repo` );
			try {
				await octokit.rest.issues.createLabel( {
					owner: ownerLogin,
					repo: name,
					name: label.name,
					color: label.color,
					description: label.description,
				} );
			} catch ( error ) {
				if ( error.status === 422 && error.message.includes( 'already_exists' ) ) {
					debug( `sync-labels: "${ label.name }" label already exists in the repo. Skipping` );
				} else {
					debug( `sync-labels: error while creating a new label: ${ error.message }` );
				}
			}

			// Sleep for 2 seconds to avoid rate limiting
			await new Promise( resolve => setTimeout( resolve, 2000 ) );
		}
	}
}
module.exports = syncLabels;
