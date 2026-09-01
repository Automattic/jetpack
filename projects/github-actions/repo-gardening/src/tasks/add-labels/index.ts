import { getInput } from '@actions/core';
import cleanName from '../../utils/clean-name.ts';
import debug from '../../utils/debug.ts';
import getFiles from '../../utils/get-files.ts';
import getAvailableLabels from '../../utils/labels/get-available-labels.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import type { OctokitClient, PullRequestEvent } from '../../types.ts';

/**
 * Build a list of labels to add to the pull request, based off our file list.
 *
 * @param octokit  - Initialized Octokit REST client.
 * @param owner    - Repository owner.
 * @param repo     - Repository name.
 * @param number   - PR number.
 * @param isDraft  - Whether the pull request is a draft.
 * @param isRevert - Whether the pull request is a revert.
 * @return Promise resolving to an array of keywords we'll search for.
 */
async function getFileDerivedLabels(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number,
	isDraft: boolean,
	isRevert: boolean
): Promise< string[] > {
	const keywords = new Set< string >();

	// Get next valid milestone.
	const files = await getFiles( octokit, owner, repo, number );

	if ( ! files ) {
		throw new Error( 'No files were modified in this PR' );
	}

	debug( 'add-labels: Loop through all files modified in this PR and add matching labels.' );

	for ( const file of files ) {
		// Projects.
		const project = file.match( /^projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
		if ( project?.groups?.ptype && project.groups.pname ) {
			const prefix = {
				'github-actions': 'Action',
				packages: 'Package',
				plugins: 'Plugin',
				'js-packages': 'JS Package',
			}[ project.groups.ptype ] as string | undefined;
			if ( prefix === undefined ) {
				const err = new Error(
					`Cannot determine label prefix for plugin type "${ project.groups.ptype }"`
				);
				// Produce a GitHub error annotation pointing here.
				const line = Number( err.stack?.split( '\n' )[ 1 ]?.split( ':' )[ 1 ] ) - 2;
				debug( `::error file=${ import.meta.filename },line=${ line }::${ err.message }` );
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
			const addedLabels: Array< { path: string; label: string } > = JSON.parse( addLabelsString );
			addedLabels.forEach( passed => {
				if ( file.startsWith( passed.path ) ) {
					debug( `passing: ${ passed.label } for ${ passed.path }` );
					keywords.add( passed.label );
				}
			} );
		}

		// Modules.
		const module = file.match( /^projects\/plugins\/jetpack\/modules\/(?<module>[^/]*)\// );
		const moduleName = module?.groups?.module;
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
			if ( contactForm?.groups?.blocks ) {
				keywords.add( '[Block] Contact Form' );
			}
		}

		// The SSO feature now lives in both a package and a Jetpack module.
		const sso = file.match( /^projects\/packages\/connection\/src\/sso\// );
		if ( sso !== null ) {
			keywords.add( '[Feature] SSO' );
		}

		// The Google Analytics feature now lives in both a package and a Jetpack module.
		const googleAnalytics = file.match( /^projects\/packages\/google-analytics\// );
		if ( googleAnalytics !== null ) {
			keywords.add( '[Feature] Google Analytics' );
		}

		// The Publicize feature now lives in a package, a Jetpack module, and a js package.
		const publicize = file.match(
			/^projects\/(packages\/publicize|js-packages\/publicize-components)\//
		);
		if ( publicize !== null ) {
			keywords.add( '[Feature] Publicize' );
		}

		// Theme Tools have now been extracted to their own package.
		const themeTools = file.match( /^projects\/packages\/classic-theme-helper\// );
		if ( themeTools !== null ) {
			keywords.add( '[Feature] Theme Tools' );
		}

		// The Masterbar feature now lives in both a package and a Jetpack module.
		const masterbar = file.match( /^projects\/packages\/masterbar\// );
		if ( masterbar !== null ) {
			keywords.add( '[Feature] Masterbar' );
		}

		// Social Previews are now developed in a separate package.
		const socialPreviews = file.match(
			/^projects\/js-packages\/publicize-components\/src\/components\/social-previews\//
		);
		if ( socialPreviews !== null ) {
			keywords.add( '[Extension] Social Previews' );
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

		const docs = file.match( /^docs\/|\.md$/ ) && ! file.match( /CHANGELOG\.md$/i );
		if ( docs ) {
			keywords.add( 'Docs' );
		}

		// Existing blocks and block plugins.
		const blocks = file.match(
			/^projects\/plugins\/jetpack\/extensions\/(?<type>blocks|plugins)\/(?<block>[^/]*)\//
		);
		if ( blocks !== null ) {
			const blockType = blocks?.groups?.type;
			const blockName = blocks?.groups?.block;
			if ( blockType && blockName ) {
				keywords.add(
					`[${ 'plugins' === blockType ? 'Extension' : 'Block' }] ${ cleanName( blockName ) }`
				);
			}
		}

		// External Media extension.
		const externalMedia = file.match(
			/^projects\/plugins\/jetpack\/extensions\/shared\/external-media\//
		);
		if ( externalMedia !== null ) {
			keywords.add( '[Extension] External Media' );
		}

		// React Dashboard and Boost Admin.
		const reactAdmin = file.match(
			/^(projects\/plugins\/(boost\/app)\/admin|projects\/plugins\/jetpack\/_inc\/client)\//
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

		// mu wpcom features.
		const muWpcomFeatures = file.match(
			/^projects\/packages\/jetpack-mu-wpcom\/src\/features\/(?<muWpcomFeature>[^/]*)\//
		);
		const muWpcomFeatureName = muWpcomFeatures?.groups?.muWpcomFeature;
		if ( muWpcomFeatureName ) {
			keywords.add( `[mu wpcom Feature] ${ cleanName( muWpcomFeatureName ) }` );
		}

		// Boost Features
		const boostModules = file.match(
			/^projects\/plugins\/boost\/app\/(?:modules|features)\/(?:optimizations\/)?(?<boostModule>[^/]*)\//
		);
		const boostModuleName = boostModules?.groups?.boostModule;
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
	}

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

	// Add 'Bug' for revert PRs
	if ( isRevert ) {
		keywords.add( 'Bug' );
	}

	return [ ...keywords ];
}

/**
 * Adds appropriate labels to the specified PR.
 *
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function addLabels( payload: PullRequestEvent, octokit: OctokitClient ): Promise< void > {
	const { number, repository, pull_request } = payload;
	const { owner, name } = repository;
	const { draft, title, head, base } = pull_request;

	// GitHub allows 100 labels on a PR.
	// Limit to less than that to allow a buffer for future manual labels.
	const maxLabels = 90;
	const bigProjectLabel = '[Project] All the things!';

	// Get labels to add to the PR.
	const isDraft = !! ( pull_request && draft );

	// If the PR title includes the word "revert", mark it as such.
	const isRevert = title.toLowerCase().includes( 'revert' );

	const fileDerivedLabels = await getFileDerivedLabels(
		octokit,
		owner.login,
		name,
		number,
		isDraft,
		isRevert
	);

	// Grab current labels on the PR.
	// We can't rely on payload, as it could be outdated by the time this runs.
	const currentLabels = await getLabels( octokit, owner.login, name, number );

	// This is an array of labels that GitHub doesn't already have.
	let labelsToAdd = fileDerivedLabels.filter( label => ! currentLabels.includes( label ) );

	// Nothing new was added, so abort.
	if ( labelsToAdd.length === 0 ) {
		debug( 'add-labels: No new labels to add to that PR. Aborting.' );
		return;
	}

	// For fork PRs, only add labels that already exist in the repo
	// to avoid creating new labels from untrusted sources.
	const isFork = head.repo?.full_name !== base.repo?.full_name;
	if ( isFork ) {
		debug( 'add-labels: PR is from a fork. Filtering to only existing repo labels.' );
		const availableLabels = await getAvailableLabels( octokit, owner.login, name );
		const availableLabelNames = new Set( availableLabels.map( label => label.name ) );
		labelsToAdd = labelsToAdd.filter( label => availableLabelNames.has( label ) );
	}

	// Determine how many labels can safely be added.
	let maxLabelsToAdd = Math.max( 0, maxLabels - currentLabels.length );

	// Overkill, but let's prevent this label from counting toward the max.
	const hasBigProjectLabel = currentLabels.includes( bigProjectLabel );
	if ( hasBigProjectLabel ) {
		maxLabelsToAdd++;
	}

	// If there are too many labels, we need to reduce the label count to keep GitHub happy.
	if ( labelsToAdd.length > maxLabelsToAdd ) {
		debug( `add-labels: Too many labels! Grouping project labels into '${ bigProjectLabel }'.` );

		// Filter out project-type labels in deference to bigProjectLabel.
		// In theory we could also remove any existing project-type labels here, but for now
		// let's not as that would prevent manually adding specific project labels.
		const projectLabelRegex = /^(\[Action\]|\[Package\]|\[Plugin\]|\[JS Package\])/;
		labelsToAdd = labelsToAdd.filter( label => ! projectLabelRegex.test( label ) );

		if ( ! hasBigProjectLabel ) {
			// Add to the beginning of the labels array in case the array gets truncated later on.
			labelsToAdd.unshift( bigProjectLabel );
		}
	} else if ( hasBigProjectLabel ) {
		await octokit.rest.issues.removeLabel( {
			owner: owner.login,
			repo: name,
			issue_number: number,
			name: bigProjectLabel,
		} );
	}
	// In the rare chance there would still be too many labels...
	if ( labelsToAdd.length > maxLabelsToAdd ) {
		debug( `add-labels: Limiting to the first ${ maxLabels }.` );
		labelsToAdd.splice( maxLabelsToAdd );
	}

	// Check again, as all the above may have cleared out the labels we were going to add.
	if ( labelsToAdd.length === 0 ) {
		debug( 'add-labels: No new labels to add to that PR. Aborting.' );
		return;
	}

	debug( `add-labels: Adding labels ${ labelsToAdd } to PR #${ number }` );

	await octokit.rest.issues.addLabels( {
		owner: owner.login,
		repo: name,
		issue_number: number,
		labels: labelsToAdd,
	} );
}

export default addLabels;
