const debug = require( '../../debug' );
const getFiles = require( '../../get-files' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Clean up a feature name:
 * - Handle some exceptions in our codename / feature names.
 * - Replace dashes by spaces.
 * - Capitalize.
 *
 * @param {string} name - Feature name.
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

	// render-blocking-js is a Boost feature.
	if ( name === 'render-blocking-js' ) {
		name = 'Defer JS';
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
				'js-packages': 'JS Package',
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

			if ( project.groups.ptype === 'js-packages' ) {
				keywords.add( 'RNA' );
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
		const docker = file.match( /^(projects\/plugins\/boost\/docker|tools\/docker)\// );
		if ( docker !== null ) {
			keywords.add( 'Docker' );
		}

		const cliTools = file.match( /^tools\/cli\// );
		if ( cliTools !== null ) {
			keywords.add( '[Tools] Development CLI' );
		}

		const docs = file.match( /^docs\// );
		if ( docs !== null ) {
			keywords.add( 'Docs' );
		}

		// Existing blocks and block plugins.
		// If you update the label names here, make sure to update them in add-issue-to-board/index.js as well.
		const blocks = file.match(
			/^projects\/plugins\/jetpack\/extensions\/(?<type>blocks|plugins)\/(?<block>[^/]*)\//
		);
		if ( blocks !== null ) {
			const { groups: { type: blockType, block: blockName } = {} } = blocks;
			if ( blockType && blockName ) {
				keywords.add(
					`[${ 'plugins' === blockType ? 'Extension' : 'Block' }] ${ cleanName( blockName ) }`
				);
			}
		}

		// React Dashboard and Boost Admin.
		const reactAdmin = file.match(
			/^(projects\/plugins\/boost\/app\/admin|projects\/plugins\/jetpack\/_inc\/client)\//
		);
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

		// Boost Critical CSS.
		const boostModules = file.match(
			/^projects\/plugins\/boost\/app\/modules\/(?<boostModule>[^/]*)\//
		);
		const boostModuleName = boostModules && boostModules.groups.boostModule;
		if ( boostModuleName ) {
			keywords.add( `[Boost Feature] ${ cleanName( boostModuleName ) }` );
		}

		// Compatibility with 3rd party tools (Boost and Jetpack).
		const compat = file.match(
			/^(projects\/plugins\/boost\/compatibility|projects\/plugins\/jetpack\/3rd-party)\//
		);
		if ( compat ) {
			keywords.add( 'Compatibility' );
		}

		// E2E tests.
		const e2e = file.match( /\/tests\/e2e\/|^tools\/e2e-commons\// );
		if ( e2e ) {
			keywords.add( 'E2E Tests' );
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

	await octokit.rest.issues.addLabels( {
		owner: owner.login,
		repo: name,
		issue_number: number,
		labels,
	} );
}

module.exports = addLabels;
