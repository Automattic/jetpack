/**
 * External dependencies
 */
import { danger, warn, markdown, results, schedule } from 'danger';
const moment = require( 'moment' );

const pr = danger.github.pr;
const github = danger.github;

// Calculate next release date
const firstTuesdayOfMonth = moment().add( 1, 'months' ).startOf( 'month' );
while ( firstTuesdayOfMonth.day() !== 2 ) {
	firstTuesdayOfMonth.add( 1, 'day' );
}
const jetpackReleaseDate = firstTuesdayOfMonth.format( 'LL' );

// Calculate next code freeze date
const codeFreezeDate = firstTuesdayOfMonth.subtract( 7, 'd' ).format( 'LL' );

// No PR is too small to include a description of why you made a change
if ( pr.body.length < 10 ) {
	warn( 'Please include a description of your PR changes.' );
}

// Use labels please!
const ghLabels = github.issue.labels;
if ( ! ghLabels.find( l => l.name.toLowerCase().includes( '[status]' ) ) ) {
	warn( 'The PR is missing at least one [Status] label. Suggestions: `[Status] In Progress`, `[Status] Needs Review`' );
}

// Test instructions
if ( ! pr.body.includes( 'Testing instructions' ) ) {
	warn( '"Testing instructions" are missing for this PR. Please add some' );
}

// Proposed changelog entry
if ( ! pr.body.includes( 'Proposed changelog entry' ) ) {
	warn( '"Proposed changelog entry" is missing for this PR. Please include any meaningful changes' );
}
// skip if there are no warnings.
if ( results.warnings.length > 0 || results.fails.length > 0 ) {
	markdown( "This is automated check which relies on [`PULL_REQUEST_TEMPLATE`](https://github.com/Automattic/jetpack/blob/master/.github/PULL_REQUEST_TEMPLATE.md).We encourage you to follow that template as it helps Jetpack maintainers do their job. If you think 'Testing instructions' or 'Proposed changelog entry' are not needed for your PR - please explain why you think so. Thanks for cooperation :robot:" );
} else {
	schedule( async () => {
		const internalContributor = await github.api.orgs.checkMembership( { org: 'Automattic', username: pr.user.login } );
		if ( internalContributor ) {
			markdown(
`**Thank you for the great PR description!**

When this PR is ready for review, please apply the \`[Status] Needs Review\` label and if possible have someone from your team review the code. The Jetpack team will also review this PR and merge it to be included in the next Jetpack release.` );
		} else {
			markdown(
`**That's a great PR description, thank you so much for your effort!**

Wondering what will happen next? The Jetpack team will jump in and review this PR, and merge it once all the feedback has been addressed. Once the PR is merged, your changes will be included in the next Jetpack release.` );
		}
		markdown( `
Scheduled Jetpack release: _${ jetpackReleaseDate }_.
Scheduled code freeze: _${ codeFreezeDate }_`
		);
	} );
}
