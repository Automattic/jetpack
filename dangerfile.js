/**
 * External dependencies
 */
import { danger, warn, markdown, results, schedule, fail } from 'danger';
const moment = require( 'moment' );
const phpRequirelist = require( './bin/phpcs-requirelist' );

const github = danger.github;
const pr = github.pr;
const newFiles = danger.git.created_files;

// No PR is too small to include a description of why you made a change
if ( pr.body.length < 10 ) {
	warn( 'Please include a description of your PR changes.' );
}

// Keep track of commits which skipped pre-commit hook
const notVerifiedCommits = danger.git.commits.filter( commit =>
	commit.message.includes( '[not verified]' )
);
if ( notVerifiedCommits.length > 0 ) {
	warn( '`pre-commit` hook was skipped for one or more commits' );
}

// Use labels please!
const ghLabels = github.issue.labels;
if ( ! ghLabels.find( l => l.name.toLowerCase().includes( '[status]' ) ) ) {
	warn(
		'The PR is missing at least one `[Status]` label. Suggestions: `[Status] In Progress`, `[Status] Needs Review`'
	);
}

// Test instructions
if ( ! pr.body.includes( 'Testing instructions' ) ) {
	warn( '"Testing instructions" are missing for this PR. Please add some' );
}

// Proposed changelog entry
if ( ! pr.body.includes( 'Proposed changelog entry' ) ) {
	warn(
		'"Proposed changelog entry" is missing for this PR. Please include any meaningful changes'
	);
}

// Privacy section filled in
if ( ! pr.body.includes( 'data or activity we track or use' ) ) {
	warn(
		'The Privacy section is missing for this PR. Please specify whether this PR includes any changes to data or privacy.'
	);
}

// Check if newly added .php files were added to phpcs linter require list.
if ( newFiles.length > 0 ) {
	const newPHPFiles = newFiles.filter(
		fileName => fileName.includes( '.php' ) && ! fileName.includes( 'tests/php' )
	);

	const notRequireListedFiles = [];

	newPHPFiles.forEach( file => {
		const requireListedPath = phpRequirelist.find( path => file.includes( path ) );
		if ( ! requireListedPath ) {
			notRequireListedFiles.push( file );
		}
	} );

	if ( notRequireListedFiles.length > 0 ) {
		const stringifiedFilesList = '\n' + notRequireListedFiles.join( '\n' );
		fail(
			'Please add these new PHP files to PHPCS required list in bin/phpcs-requirelist.js for automatic linting:' +
				stringifiedFilesList
		);
	}
}

// skip if there are no warnings.
if ( results.warnings.length > 0 || results.fails.length > 0 ) {
	markdown(
		"This is an automated check which relies on [`PULL_REQUEST_TEMPLATE`](https://github.com/Automattic/jetpack/blob/master/.github/PULL_REQUEST_TEMPLATE.md). We encourage you to follow that template as it helps Jetpack maintainers do their job. If you think 'Testing instructions' or 'Proposed changelog entry' are not needed for your PR - please explain why you think so. Thanks for cooperation :robot:"
	);
} else {
	markdown(
		`**Thank you for the great PR description!**

When this PR is ready for review, please apply the \`[Status] Needs Review\` label. If you are an a11n, please have someone from your team review the code if possible. The Jetpack team will also review this PR and merge it to be included in the next Jetpack release.`
	);
	setReleaseDates();
}

// Add note about E2E dashboard
if ( process.env.TRAVIS_PULL_REQUEST ) {
	const dashboardUrl = `https://jetpack-e2e-dashboard.herokuapp.com/pr-${ process.env.TRAVIS_PULL_REQUEST }`;
	const msg = `E2E results is available here (for debugging purposes): [${ dashboardUrl }](${ dashboardUrl })`;
	markdown( '\n\n' + msg );
}

/**
 * Adds release and code freeze dates according to x.x milestone due date
 */
function setReleaseDates() {
	schedule( async () => {
		let jetpackReleaseDate;
		let codeFreezeDate;
		const milestones = await github.api.issues.listMilestonesForRepo( {
			owner: 'Automattic',
			repo: 'jetpack',
		} );

		// Find a milestone which name is a version number
		// and it's due dates is earliest in a future
		const nextMilestone = milestones.data
			.filter( m => m.title.match( /\d\.\d/ ) )
			.sort( ( m1, m2 ) => parseFloat( m1.title ) - parseFloat( m2.title ) )
			.find( milestone => milestone.due_on && moment( milestone.due_on ) > moment() );

		if ( nextMilestone ) {
			jetpackReleaseDate = moment( nextMilestone.due_on ).format( 'LL' );
			codeFreezeDate = moment( nextMilestone.due_on ).subtract( 7, 'd' ).format( 'LL' );
		} else {
			// Fallback to raw math calculation
			// Calculate next release date
			const firstTuesdayOfMonth = moment().add( 1, 'months' ).startOf( 'month' );
			while ( firstTuesdayOfMonth.day() !== 2 ) {
				firstTuesdayOfMonth.add( 1, 'day' );
			}
			jetpackReleaseDate = firstTuesdayOfMonth.format( 'LL' );
			// Calculate next code freeze date
			codeFreezeDate = firstTuesdayOfMonth.subtract( 8, 'd' ).format( 'LL' );
		}

		markdown( `

Scheduled Jetpack release: _${ jetpackReleaseDate }_.
Scheduled code freeze: _${ codeFreezeDate }_` );
	} );
}
