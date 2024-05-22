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
	const name_exceptions = {
		'custom-post-types': 'Custom Content Types', // We name our CPTs "Custom Content Types" to avoid confusion with WordPress's CPT.
		'instagram-gallery': 'Latest Instagram Posts', // Latest Instagram Posts used to be named "Instagram Gallery".
		'mu-wpcom-plugin': 'mu-wpcom', // [Plugin] mu wpcom plugin is a bit too long.
		'premium-content': 'Paid content', // Premium Content was renamed into Paid content.
		'rating-star': 'Star Rating', // Rating Star was renamed into Star Rating.
		'recurring-payments': 'Payments', // Payments used to be called Recurring Payments.
		'render-blocking-js': 'Defer JS', // render-blocking-js is a Boost feature.
		sharedaddy: 'Sharing', // Sharedaddy is a legacy codename.
		shortcodes: 'Shortcodes / Embeds', // Our Shortcodes feature includes shortcodes and embeds.
		'simple-payments': 'Pay With Paypal', // Simple Payments was renamed to "Pay With Paypal".
		stats: 'Stats Data', // We customize the Stats module's name to differentiate from the Stats UI (Stats dashboard).
		widgets: 'Extra Sidebar Widgets', // Our widgets are "Extra Sidebar Widgets".
		'woo-sync': 'WooSync', // The WooSync module does not have a space, despite legacy naming
		wordads: 'Ad', // WordAds is a codename. We name the feature just "Ad" or "Ads".
		'wpcom-block-editor': 'WordPress.com Block Editor', // WordPress.com Block Editor lives under 'wpcom-block-editor'.
	};

	if ( name_exceptions[ name ] ) {
		// don't return here, as at least of the above (mu-wpcom) is further changed below
		name = name_exceptions[ name ];
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
 * @param {boolean} isRevert  - Whether the pull request is a revert.
 * @returns {Promise<Array>} Promise resolving to an array of keywords we'll search for.
 */
async function getLabelsToAdd( octokit, owner, repo, number, isDraft, isRevert ) {
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

		// Custom [{ "path": "...", "label": "..." }] values passed from a workflow.
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

		// The Contact Form feature now lives in both a package and a Jetpack module.
		const contactForm = file.match( /^projects\/packages\/forms\/(?<blocks>src\/blocks)?/ );
		if ( contactForm !== null ) {
			keywords.add( '[Feature] Contact Form' );
			if ( contactForm.groups.blocks ) {
				keywords.add( '[Block] Contact Form' );
			}
		}

		// The SSO feature nows lives in both a package and a Jetpack module.
		const sso = file.match( /^projects\/packages\/connection\/src\/sso\// );
		if ( sso !== null ) {
			keywords.add( '[Feature] SSO' );
		}

		// The Google Analytics feature nows lives in both a package and a Jetpack module.
		const googleAnalytics = file.match( /^projects\/packages\/google-analytics\// );
		if ( googleAnalytics !== null ) {
			keywords.add( '[Feature] Google Analytics' );
		}

		// Theme Tools have now been extracted to their own package.
		const themeTools = file.match( /^projects\/packages\/classic-theme-helper\// );
		if ( themeTools !== null ) {
			keywords.add( '[Feature] Theme Tools' );
		}

		// The WooCommerce Analytics feature now lives in both a package and a Jetpack module.
		const wooCommerceAnalytics = file.match( /^projects\/packages\/woocommerce-analytics\// );
		if ( wooCommerceAnalytics !== null ) {
			keywords.add( '[Feature] WooCommerce Analytics' );
		}

		// The Masterbar feature now lives in both a package and a Jetpack module.
		const masterbar = file.match( /^projects\/packages\/masterbar\// );
		if ( masterbar !== null ) {
			keywords.add( '[Feature] Masterbar' );
		}

		// The Calypsoify feature now lives in both a package and a Jetpack module.
		const calypsoify = file.match( /^projects\/packages\/calypsoify\// );
		if ( calypsoify !== null ) {
			keywords.add( '[Feature] Calypsoify' );
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

		// Boost Features
		const boostModules = file.match(
			/^projects\/plugins\/boost\/app\/(?:modules|features)\/(?:optimizations\/)?(?<boostModule>[^/]*)\//
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

	// Add '[Type] Revert' for revert PRs
	if ( isRevert ) {
		keywords.add( '[Type] Revert' );
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
	const { draft, title } = pull_request;

	// Get labels to add to the PR.
	const isDraft = !! ( pull_request && draft );

	// If the PR title includes the word "revert", mark it as such.
	const isRevert = title.toLowerCase().includes( 'revert' );

	const labels = await getLabelsToAdd( octokit, owner.login, name, number, isDraft, isRevert );

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
