/**
 * External dependencies
 */
import { danger, warn, markdown, results, schedule } from 'danger';
import moment from 'moment';

const pr = danger.github.pr;
const github = danger.github;
const git = danger.git;

let jetpackReleaseDate = moment().add( 1, 'months' ).startOf( 'month' );
while ( jetpackReleaseDate.day() !== 2 ) {
	jetpackReleaseDate.add( 1, 'day' );
}

jetpackReleaseDate = jetpackReleaseDate.format( 'LL' );
const codeFreezeDate = moment( jetpackReleaseDate ).subtract( 7, 'd' ).format( 'LL' );

// Skip danger check if "no ci" or "no danger" in latest commit
const lastCommit = git.commits.slice( -1 )[ 0 ].message;
if (
	lastCommit.includes( 'no ci' ) ||
	lastCommit.includes( 'skip ci' ) ||
	lastCommit.includes( 'no danger' ) ||
	lastCommit.includes( 'skip danger' )
) {
	process.exit( 0 ); // eslint-disable-line no-process-exit
}

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
`Thank you for the great PR description!
When this PR is ready for review, please apply the \`[status] Needs Review\` label and if possible have someone from your team review the code. The Jetpack team will also review this PR and merge it to be included in the next release: ${ jetpackReleaseDate }.
Code freeze date: ${ codeFreezeDate }`
);
		} else {
			markdown(
`That's a great PR description, thank you so much for your effort!
Wondering what's will happen next? The Jetpack team will jump in and review this PR, and merge it once all the feedback will be addressed. Once it merged - your changes will be included in next Jetpack release: ${ jetpackReleaseDate }`
);
		}
	} );
}
