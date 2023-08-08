const { getInput } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getFiles = require( '../../utils/get-files' );

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

	// [Plugin] mu wpcom plugin is a bit too long.
	if ( name === 'mu-wpcom-plugin' ) {
		name = 'mu-wpcom';
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
 * @param {boolean} isDraft  - Whether the pull request is a draft.
 * @returns {Promise<Array>} Promise resolving to an array of keywords we'll search for.
 */
async function getLabelsToAdd( octokit, owner, repo, number, isDraft ) {
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

		// Custom [{ "path": "label" }] values passed from a workflow.
		const addLabelsString = getInput( 'add_labels' );
		if ( addLabelsString ) {
			debug( `GOT addLabelsString: ${ addLabelsString }` );
			const addedLabels = JSON.parse( addLabelsString );
			addedLabels.forEach( passed => {
				if ( file.startsWith( passed.path ) ) {
					debug( `passing: ${ passed.label } for ${ passed.path }` );
					keywords.add( passed.label );
				}
			} );
		}

		// Modules.
		const module = file.match( /^projects\/plugins\/jetpack\/modules\/(?<module>[^/]*)\// );
		const moduleName = module && module.groups.module;
		if ( moduleName ) {
			keywords.add( `[Feature] ${ cleanName( moduleName ) }` );
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

		const docs = file.match( /^docs\/|\.md$/ ) && ! file.match( /\/CHANGELOG\.md$/ );
		if ( docs !== null ) {
			keywords.add( 'Docs' );
		}

		// Existing blocks and block plugins.
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
			/^(projects\/plugins\/(crm|boost\/app)\/admin|projects\/plugins\/jetpack\/_inc\/client)\//
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
			keywords.add( '[Feature] WPCOM API' );
		}

		// CRM elements.
		const crmModules = file.match( /^projects\/plugins\/crm\/modules\/(?<crmModule>[^/]*)\// );
		const crmModuleName = crmModules && crmModules.groups.crmModule;
		if ( crmModuleName ) {
			keywords.add( `[CRM] ${ cleanName( crmModuleName ) } Module` );
		}

		const crmApi = file.match( /^projects\/plugins\/crm\/api\// );
		if ( crmApi !== null ) {
			keywords.add( '[CRM] API' );
		}

		// mu wpcom features.
		const muWpcomFeatures = file.match(
			/^projects\/packages\/jetpack-mu-wpcom\/src\/features\/(?<muWpcomFeature>[^/]*)\//
		);
		const muWpcomFeatureName = muWpcomFeatures && muWpcomFeatures.groups.muWpcomFeature;
		if ( muWpcomFeatureName ) {
			keywords.add( `[mu wpcom Feature] ${ cleanName( muWpcomFeatureName ) }` );
		}

		// Boost Critical CSS.
		const boostModules = file.match(
			/^projects\/plugins\/boost\/app\/(?:modules|features)\/(?<boostModule>[^/]*)\//
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
			keywords.add( '[Focus] Compatibility' );
		}

		// E2E tests.
		const e2e = file.match( /\/tests\/e2e\/|^tools\/e2e-commons\// );
		if ( e2e ) {
			keywords.add( 'E2E Tests' );
		}

		// Tests.
		const anyTestFile = file.match( /\/tests?\// );
		if ( anyTestFile ) {
			keywords.add( '[Tests] Includes Tests' );
		}
	} );

	// The Image CDN was previously named "Photon".
	// If we're touching that package, let's add the Photon label too
	// so we can keep track of changes to the feature.
	if ( keywords.has( '[Package] Image Cdn' ) ) {
		keywords.add( '[Feature] Photon' );
	}

	// Add '[Status] In Progress' for draft PRs
	if ( isDraft ) {
		keywords.add( '[Status] In Progress' );
	}

	return [ ...keywords ];
}

/**
 * Assigns any issues that are being worked to the author of the matching PR.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function addLabels( payload, octokit ) {
	const { number, repository, pull_request } = payload;
	const { owner, name } = repository;

	// Get labels to add to the PR.
	const isDraft = !! ( pull_request && pull_request.draft );
	const labels = await getLabelsToAdd( octokit, owner.login, name, number, isDraft );

	if ( ! labels.length ) {
		debug( 'add-labels: Could not find labels to add to that PR. Aborting' );
		return;
	}

	debug( `add-labels: Adding labels ${ labels } to PR #${ number }` );

	await octokit.rest.issues.addLabels( {
		owner: owner.login,
		repo: name,
		issue_number: number,
		labels,
	} );
}

module.exports = addLabels;
