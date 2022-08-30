const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getComments = require( '../../utils/get-comments' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Search for a previous comment from this task in our issue.
 *
 * @param {Array} issueComments - Array of all comments on that issue.
 * @returns {Promise<Object>} Promise resolving to an object of information about our comment.
 */
async function getListComment( issueComments ) {
	let commentInfo = {};

	debug( `gather-support-references: Looking for a previous comment from this task in our issue.` );

	issueComments.map( comment => {
		if (
			comment.user.login === 'github-actions[bot]' &&
			comment.body.includes( '**Support References**' )
		) {
			commentInfo = {
				id: comment.id,
				body: comment.body,
			};
		}
	} );

	return commentInfo;
}

/**
 * Scan the contents of the issue as well as all its comments, get all support references, and add them to an array of references.
 *
 * @param {GitHub} octokit      - Initialized Octokit REST client.
 * @param {string} owner        - Repository owner.
 * @param {string} repo         - Repository name.
 * @param {string} number       - Issue number.
 * @param {Array} issueComments - Array of all comments on that issue.
 * @returns {Promise<Array>} Promise resolving to an array.
 */
async function getIssueReferences( octokit, owner, repo, number, issueComments ) {
	const ticketReferences = [];
	const referencesRegexP = /[0-9]*-(?:zen|zd)/gim;

	debug( `gather-support-references: Getting references from issue body.` );
	const {
		data: { body },
	} = await octokit.rest.issues.get( {
		owner: owner.login,
		repo,
		issue_number: +number,
	} );
	ticketReferences.push( ...body.matchAll( referencesRegexP ) );

	debug( `gather-support-references: Getting references from comments.` );
	issueComments.map( comment => {
		if (
			comment.user.login !== 'github-actions[bot]' ||
			! comment.body.includes( '**Support References**' )
		) {
			ticketReferences.push( ...comment.body.matchAll( referencesRegexP ) );
		}
	} );

	// Let's build a array with unique and correct support IDs, formatted properly.
	const correctedSupportIds = new Set();
	ticketReferences.map( reference => {
		const supportId = reference[ 0 ];

		// xxx-zen is the preferred format for tickets.
		// xxx-zd, as well as its uppercase version, is considered an alternate version.
		const wrongId = supportId.match( /([0-9]*)-zd/i );
		if ( wrongId ) {
			const correctedId = `${ wrongId[ 1 ] }-zen`;
			correctedSupportIds.add( correctedId );
		} else {
			correctedSupportIds.add( supportId.toLowerCase() );
		}
	} );

	return [ ...correctedSupportIds ];
}

/**
 * Build a comment body with a to-do list of all support references on that issue.
 *
 * @param {Array}   issueReferences     - Array of support references.
 * @param {Set}     checkedRefs         - Set of support references already checked.
 * @param {boolean} needsEscalationNote - Whether the issue needs an escalation note.
 * @param {string}  escalationNote      - String that indicates an issue was escalated.
 * @returns {string} Comment body.
 */
function buildCommentBody(
	issueReferences,
	checkedRefs = new Set(),
	needsEscalationNote = false,
	escalationNote = ''
) {
	let commentBody = `**Support References**

*This comment is automatically generated. Please do not edit it.*

${ issueReferences
	.map(
		reference => `
- [${ checkedRefs.has( reference ) ? 'x' : ' ' }] ${ reference }`
	)
	.join( '' ) }
`;

	// If this issue was escalated, make note of it, so next time we edit that comment, we won't escalate it again.
	if ( needsEscalationNote === true ) {
		commentBody += `\n${ escalationNote }`;
	}

	return commentBody;
}

/**
 * Build an object containing the slack message and its formatting to send to Slack.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {string}              channel - Slack channel ID.
 * @param {string}              message - Basic message (without the formatting).
 * @returns {Object} Object containing the slack message and its formatting.
 */
function formatSlackMessage( payload, channel, message ) {
	const { issue, repository } = payload;
	const { html_url, title } = issue;

	let dris = '@bug_herders';
	switch ( repository.full_name ) {
		case 'Automattic/jetpack':
			dris = '@jpop-da';
			break;
		case 'Automattic/zero-bs-crm':
		case 'Automattic/sensei':
		case 'Automattic/WP-Job-Manager':
			dris = '@heysatellite';
			break;
	}

	return {
		channel,
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: message,
				},
			},
			{
				type: 'divider',
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `${ dris } Could you take a look at it, re-prioritize and escalate if you think that's necessary, and mark this message as :done: once you've done so? Thank you!`,
				},
			},
			{
				type: 'divider',
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `<${ html_url }|${ title }>`,
				},
				accessory: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'View',
						emoji: true,
					},
					value: 'click_review',
					url: `${ html_url }`,
					action_id: 'button-action',
				},
			},
		],
		text: `${ message } -- <${ html_url }|${ title }>`, // Fallback text for display in notifications.
		mrkdwn: true, // Formatting of the fallback text.
		unfurl_links: false,
		unfurl_media: false,
	};
}

/**
 * Check if an issue needs to be escalated to the triage team.
 *
 * If our issue has gathered more than 10 tickets,
 * if we have the necessary Slack tokens,
 * if we didn't send anything to Slack about that issue yet,
 * let's send a Slack message to warn the triage team,
 * and make a note so we don't send it again.
 *
 * @param {Array}               issueReferences - Array of support references.
 * @param {string}              commentBody     - Previous comment ID.
 * @param {string}              escalationNote  - String that indicates an issue was escalated.
 * @param {WebhookPayloadIssue} payload         - Issue event payload.
 * @returns {Promise<boolean>} Was the issue escalated?
 */
async function checkForEscalation( issueReferences, commentBody, escalationNote, payload ) {
	// No Slack tokens, we won't be able to escalate. Bail.
	const slackToken = getInput( 'slack_token' );
	const channel = getInput( 'slack_quality_channel' );
	if ( ! slackToken || ! channel ) {
		return false;
	}

	// Issue hasn't gathered more than 10 tickets yet, bail.
	if ( issueReferences.length < 10 ) {
		return false;
	}

	// We already sent a Slack message about this issue, bail.
	if ( commentBody.includes( escalationNote ) ) {
		debug(
			`gather-support-references: Issue ${ payload.issue.number } already escalated to triage team. No need to warn them again.`
		);
		return true;
	}

	// When the issue is already closed, do not send any Slack reminder.
	if ( payload.issue.state === 'closed' ) {
		debug(
			`gather-support-references: Issue ${ payload.issue.number } is closed, no need to escalate.`
		);
		return false;
	}

	debug(
		`gather-support-references: Issue #${ payload.issue.number } has now gathered more than 10 tickets. It's time to escalate it.`
	);
	const message = `:warning: This issue has now gathered more than 10 tickets. It may be time to reconsider its priority.`;
	const slackMessageFormat = formatSlackMessage( payload, channel, message );
	await sendSlackMessage( message, channel, slackToken, payload, slackMessageFormat );

	return true;
}

/**
 * Add or update a label on the issue to indicate a number range of support references,
 * once it has gathered more than 10 support references.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} repo - Repository name.
 * @param {string} ownerLogin - Owner of the repository.
 * @param {number} number - Issue number.
 * @param {number} issueReferencesCount - Number of support references gathered in this issue.
 * @returns {Promise<void>}
 */
async function addOrUpdateInteractionCountLabel(
	octokit,
	repo,
	ownerLogin,
	number,
	issueReferencesCount
) {
	const ranges = [ 50, 20, 10 ];

	// Check if our issue has issues in one of the ranges where we want to label it.
	const issueRange = ranges.find( range => issueReferencesCount > range );

	// Bail if our issue hasn't gathered enough support references to warrant a label.
	if ( ! issueRange ) {
		return;
	}

	// Name of the label we want to add to this issue.
	const interactionCountLabel = `[Interaction #] > ${ issueRange }`;

	debug(
		`gather-support-references: Issue #${ number } has gathered ${ issueReferencesCount } support references. It deserves a label, "${ interactionCountLabel }"`
	);

	// Check if the issue already has this label.
	const labels = await getLabels( octokit, ownerLogin, repo, number );
	const existingInteractionCountLabels = labels.filter( label =>
		label.startsWith( '[Interaction #]' )
	);

	// Our issue already has at least one interaction count label. Is is the right one?
	if ( existingInteractionCountLabels.length > 0 ) {
		await Promise.all(
			existingInteractionCountLabels.map( async existingInteractionCountLabel => {
				// if that's not the one we want to add, remove it.
				if ( existingInteractionCountLabel !== interactionCountLabel ) {
					debug(
						`gather-support-references: Issue #${ number } already has a label, "${ existingInteractionCountLabel }". We want to add the "${ interactionCountLabel }" label. Removing the "${ existingInteractionCountLabel }" label.`
					);
					await octokit.rest.issues.removeLabel( {
						owner: ownerLogin,
						repo,
						issue_number: +number,
						name: existingInteractionCountLabel,
					} );
				}
			} )
		);
	}

	// Check if the issue has the label we want to add. If so, bail, no need to add it.
	if ( existingInteractionCountLabels.includes( interactionCountLabel ) ) {
		debug(
			`gather-support-references: Issue #${ number } already has the "${ interactionCountLabel }" label. No need to add it.`
		);
		return;
	}

	// Add the label to our issue.
	debug( `gather-support-references: Adding the "${ interactionCountLabel }" label.` );
	await octokit.rest.issues.addLabels( {
		owner: ownerLogin,
		repo,
		issue_number: +number,
		labels: [ interactionCountLabel ],
	} );
}

/**
 * Creates or updates a comment on issue.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub} octokit              - Initialized Octokit REST client.
 * @param {Array} issueReferences       - Array of support references.
 * @param {Array} issueComments         - Array of all comments on that issue.
 */
async function createOrUpdateComment( payload, octokit, issueReferences, issueComments ) {
	const { issue, repository } = payload;
	const { number } = issue;
	const { name: repo, owner } = repository;
	const ownerLogin = owner.login;
	const escalationNote = '<!-- Issue escalated to triage team. ->';

	const existingComment = await getListComment( issueComments );

	// If there is a comment already, update it.
	if ( existingComment.id && existingComment.body ) {
		debug(
			`gather-support-references: update comment ID ${ existingComment.id } with our new list of references.`
		);

		// First, build a list of all references and whether they are checked or not.
		const listWithStatusMatch = existingComment.body.matchAll( /^-\s\[x\]\s(\S+)/gm );

		// Extract the checked ticket references.
		const checkedRefs = new Set();
		for ( const referenceStatus of listWithStatusMatch ) {
			checkedRefs.add( referenceStatus[ 1 ] );
		}

		// If our list includes more than 10 tickets,
		// let's send a Slack message to warn the triage team,
		// add note it so the list comment mentions that this was escalated.
		const needsEscalationNote = await checkForEscalation(
			issueReferences,
			existingComment.body,
			escalationNote,
			payload
		);

		// Add or update a label counting the number of tickets on that issue.
		await addOrUpdateInteractionCountLabel(
			octokit,
			repo,
			ownerLogin,
			number,
			issueReferences.length
		);

		// Build our comment body, with first the checked references, then the unchecked references.
		const updatedComment = buildCommentBody(
			issueReferences,
			checkedRefs,
			needsEscalationNote,
			escalationNote
		);

		await octokit.rest.issues.updateComment( {
			owner: ownerLogin,
			repo,
			body: updatedComment,
			comment_id: +existingComment.id,
		} );
	} else {
		// If no comment was published before, publish one now.
		debug( `gather-support-references: Posting comment to issue #${ number }` );

		const comment = buildCommentBody( issueReferences );

		await octokit.rest.issues.createComment( {
			owner: ownerLogin,
			repo,
			body: comment,
			issue_number: +number,
		} );
	}
}

/**
 * Post or update a comment with a to-do list of all support references on that issue.
 *
 * @param {WebhookPayloadIssue} payload - Issue or issue comment event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function gatherSupportReferences( payload, octokit ) {
	const { issue, repository } = payload;
	const { number } = issue;
	const { name: repo, owner } = repository;

	const issueComments = await getComments( octokit, owner.login, repo, number );
	const issueReferences = await getIssueReferences( octokit, owner, repo, number, issueComments );
	if ( issueReferences.length > 0 ) {
		debug( `gather-support-references: Found ${ issueReferences.length } references.` );
		await createOrUpdateComment( payload, octokit, issueReferences, issueComments );
	}
}

module.exports = gatherSupportReferences;
