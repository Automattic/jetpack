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
 * - Handle some exceptions in our codename / feature names.
 * - Replace dashes by spaces.
 * - Capitalize.
 *
 * @param {string} name - Feature name.
 *
 * @returns {string} Cleaned up feature name.
 */
function cleanName( name ) {
	// Sharedaddy is a legacy codename.
	if ( name === 'sharedaddy' ) {
		name = 'Sharing';
	}

	// Our Shortcodes feature includes shortcodes and embeds.
	if ( name === 'shortcodes' ) {
		name = 'Shortcodes / Embeds';
	}

	// We name our CPTs "Custom Content Types" to avoid confusion with WordPress's CPT.
	if ( name === 'custom-post-types' ) {
		name = 'Custom Content Types';
	}

	// Our widgets are "Extra Sidebar Widgets".
	if ( name === 'widgets' ) {
		name = 'Extra Sidebar Widgets';
	}

	// Simple Payments was renamed into "Pay With Paypal".
	if ( name === 'simple-payments' ) {
		name = 'Pay With Paypal';
	}

	// WordPress.com Block Editor lives under 'wpcom-block-editor'.
	if ( name === 'wpcom-block-editor' ) {
		name = 'WordPress.com Block Editor';
	}

	// WordAds is a codename. We name the feature just "Ad" or "Ads".
	if ( name === 'wordads' ) {
		name = 'Ad';
	}

	// Latest Instagram Posts used to be named Instagram Gallery.
	if ( name === 'instagram-gallery' ) {
		name = 'Latest Instagram Posts';
	}

	// Payments used to be called Recurring Payments.
	if ( name === 'recurring-payments' ) {
		name = 'Payments';
	}

	// Rating Star was renamed into Star Rating.
	if ( name === 'rating-star' ) {
		name = 'Star Rating';
	}

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
		// Projects.
		const project = file.match( /^projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
		if ( project && project.groups.ptype && project.groups.pname ) {
			const prefix = {
				'editor-extensions': 'Block',
				'github-actions': 'Action',
				packages: 'Package',
				plugins: 'Plugin',
			}[ project.groups.ptype ];
			if ( prefix === undefined ) {
				const err = new Error(
					`Cannot determine label prefix for plugin type "${ project.groups.ptype }"`
				);
				// Produce a GitHub error annotation pointing here.
				const line = err.stack.split( '\n' )[ 1 ].split( ':' )[ 1 ] - 2;
				debug( `::error file=${ __filename },line=${ line }::${ err.message }` );
				throw err;
			}
			keywords.add( `[${ prefix }] ${ cleanName( project.groups.pname ) }` );

			// Extra labels.
			if ( project.groups.ptype === 'github-actions' ) {
				keywords.add( 'Actions' );
			}
			if ( project.groups.ptype === 'packages' ) {
				keywords.add( '[Status] Needs Package Release' );
			}
		}

		// Modules.
		const module = file.match(
			/^projects\/plugins\/jetpack\/?(?<test>tests\/php\/)?modules\/(?<module>[^/]*)\//
		);
		const moduleName = module && module.groups.module;
		if ( moduleName ) {
			keywords.add( `${ cleanName( moduleName ) }` );
		}
		if ( module && module.groups.test ) {
			keywords.add( 'Unit Tests' );
		}

		// Actions.
		const actions = file.match( /^\.github\/(actions|workflows|files)\// );
		if ( actions !== null ) {
			keywords.add( 'Actions' );
		}

		// Docker.
		const docker = file.match( /^tools\/docker\// );
		if ( docker !== null ) {
			keywords.add( 'Docker' );
		}

		const cliTools = file.match( /^tools\/cli\// );
		if ( cliTools !== null ) {
			keywords.add( '[Tools] Development CLI' );
		}

		// Existing blocks.
		const blocks = file.match(
			/^projects\/plugins\/jetpack\/extensions\/blocks\/(?<block>[^/]*)\//
		);
		const blockName = blocks && blocks.groups.block;
		if ( blockName ) {
			keywords.add( `[Block] ${ cleanName( blockName ) }` );
		}

		// React Dashboard.
		const reactAdmin = file.match( /^projects\/plugins\/jetpack\/_inc\/client\// );
		if ( reactAdmin !== null ) {
			keywords.add( 'Admin Page' );
		}

		// Instant Search.
		const instantSearch = file.match(
			/^projects\/plugins\/jetpack\/modules\/search\/instant-search\//
		);
		if ( instantSearch !== null ) {
			keywords.add( 'Instant Search' );
		}

		// WPCOM API.
		const wpcomApi = file.match( /^projects\/plugins\/jetpack\/json-endpoints\// );
		if ( wpcomApi !== null ) {
			keywords.add( 'WPCOM API' );
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

	if ( ! labels.length ) {
		debug( 'add-labels: Could not find labels to add to that PR. Aborting' );
		return;
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
