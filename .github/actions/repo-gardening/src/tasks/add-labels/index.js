/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Get list of files modified in PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<Array>} Promise resolving to an array of all files modified in  that PR.
 */
async function getFiles( octokit, owner, repo, number ) {
	const fileList = [];

	debug( 'add-labels: Get list of files modified in this PR.' );

	for await ( const response of octokit.paginate.iterator( octokit.pulls.listFiles, {
		owner,
		repo,
		pull_number: +number,
	} ) ) {
		response.data.map( file => {
			fileList.push( file.filename );
		} );
	}

	return fileList;
}

/**
 * Clean up a feature name:
 * - Replace dashes by spaces.
 * - Capitalize.
 *
 * @param {string} name - Feature name.
 *
 * @returns {string} Cleaned up feature name.
 */
function cleanName( name ) {
	return (
		name
			// Break up words
			.split( '-' )
			// Capitalize first letter of each word.
			.map( word => `${ word[ 0 ].toUpperCase() }${ word.slice( 1 ) }` )
			// Spaces between words.
			.join( ' ' )
	);
}

/**
 * Build a list of labels to add to the issue, based off our file list.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<Array>} Promise resolving to an array of keywords we'll search for.
 */
async function getLabelsToAdd( octokit, owner, repo, number ) {
	const keywords = new Set();

	// Get next valid milestone.
	const files = await getFiles( octokit, owner, repo, number );

	if ( ! files ) {
		throw new Error( 'No files were modified in this PR' );
	}

	debug( 'add-labels: Loop through all files modified in this PR and add matching labels.' );

	files.map( file => {
		// Plugins.
		const plugin = file.match( /^projects\/plugins\/(?<plugin>\w*)\// );
		const pluginName = plugin?.groups?.plugin;
		if ( pluginName ) {
			keywords.add( `[Plugin] ${ cleanName( pluginName ) }` );
		}

		// Packages.
		const packages = file.match( /^projects\/packages\/(?<package>\w*)\// );
		const packageName = packages?.groups?.package;
		if ( packageName ) {
			keywords.add( `[Package] ${ cleanName( packageName ) }` );
			keywords.add( `[Status] Needs Package Release` );
		}

		// Modules.
		const module = file.match(
			/^projects\/plugins\/jetpack\/?(?<test>tests\/php\/)?modules\/(?<module>[a-zA-Z-]*)\//
		);
		const moduleName = module?.groups?.module;
		if ( moduleName ) {
			keywords.add( `${ cleanName( moduleName ) }` );
		}
		if ( module?.groups?.test ) {
			keywords.add( 'Unit Tests' );
		}

		// Actions.
		const actions = file.match(
			/^\.github\/actions\/|projects\/github-actions\/(?<action>[a-zA-Z-]*)\//
		);
		if ( actions !== null ) {
			keywords.add( 'Actions' );
			const actionName = actions?.groups?.action;
			if ( actionName ) {
				keywords.add( `[Actions] ${ cleanName( actionName ) }` );
			}
		}

		// Docker.
		const docker = file.match( /^tools\/docker\// );
		if ( docker !== null ) {
			keywords.add( 'Docker' );
		}

		// Blocks.
		const blocks = file.match(
			/^(?:projects\/plugins\/jetpack\/extensions\/blocks\/|projects\/editor-extensions\/)(?<block>[a-zA-Z-]*)\//
		);
		const blockName = blocks?.groups?.block;
		if ( blockName ) {
			keywords.add( `[Block] ${ cleanName( blockName ) }` );
		}
	} );

	return [ ...keywords ];
}

/**
 * Assigns any issues that are being worked to the author of the matching PR.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function addLabels( payload, octokit ) {
	const { number, repository } = payload;
	const { owner, name } = repository;

	// Get labels to add to the PR.
	const labels = await getLabelsToAdd( octokit, owner.login, name, number );

	if ( ! labels ) {
		debug( 'add-labels: Could not find labels to add to that PR. Aborting' );
		throw new Error( 'Could not find labels to add to that PR.' );
	}

	debug( `add-labels: Adding labels to PR #${ number }` );

	await octokit.issues.addLabels( {
		owner: owner.login,
		repo: name,
		issue_number: number,
		labels,
	} );
}

module.exports = addLabels;
