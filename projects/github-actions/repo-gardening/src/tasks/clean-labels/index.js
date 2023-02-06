const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Manage labels when a PR gets merged.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull Request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function cleanLabels( payload, octokit ) {
	const { pull_request, repository, action } = payload;
	const { number } = pull_request;
	const { name: repo, owner } = repository;
	const ownerLogin = owner.login;

	// Normally this only gets triggered when PRs get closed, but let's be sure.
	if ( action !== 'closed' ) {
		debug( `clean-labels: PR #${ number } is not closed. Aborting.` );
		return;
	}

	// Get array of all labels on the PR.
	const labelsOnPr = await getLabels( octokit, ownerLogin, repo, number );

	// List of all labels we want to remove.
	const labelsToRemove = [
		'[Status] Ready to Merge',
		'[Status] Needs Review',
		'[Status] Needs Team Review',
		'[Status] In Progress',
		'[Status] Needs Author Reply',
		'[Status] Needs Design',
		'[Status] Needs Design Review',
		'[Status] Design Input Requested',
		'[Status] Needs i18n Review',
		'[Status] String Freeze',
		'[Status] Needs Copy',
		'[Status] Needs Copy Review',
		'[Status] Editorial Input Requested',
	];

	const labelsToRemoveFromPr = labelsOnPr.filter( label => labelsToRemove.includes( label ) );

	if ( ! labelsToRemoveFromPr.length ) {
		debug( `clean-labels: no labels to remove from #${ number }. Aborting.` );
		return;
	}

	debug(
		`clean-labels: found some labels that will need to be removed from #${ number }: ${ JSON.stringify(
			labelsToRemoveFromPr
		) }`
	);
	labelsToRemoveFromPr.map( name => {
		debug( `clean-labels: removing the ${ name } label from PR #${ number }` );
		octokit.rest.issues.removeLabel( {
			owner: ownerLogin,
			repo,
			issue_number: number,
			name,
		} );
	} );
}

module.exports = cleanLabels;
