/**
 * External dependencies
 */
import { danger, warn } from 'danger';

// Skip danger check if "no ci"
const commitMessages = danger.git.commits.map( cmt => cmt.message );
if ( commitMessages.includes( 'no ci' ) ||
			commitMessages.includes( 'skip ci' ) ||
			commitMessages.includes( 'no danger' ) ||
			commitMessages.includes( 'skip danger' ) ) {
	process.exit( 0 ); // eslint-disable-line no-process-exit
}

// No PR is too small to include a description of why you made a change
if ( danger.github.pr.body.length < 10 ) {
	warn( 'Please include a description of your PR changes.' );
}

// Use labels please!
const ghLabels = danger.github.issue.labels;
if ( ! ghLabels.find( l => l.name.toLowerCase().includes( '[status]' ) ) ) {
	warn( 'The PR is missing at least one [Status] label. Suggestions: `[Status] In Progress`, `[Status] Needs Review`' );
}

// Test instructions
if ( ! danger.github.pr.body.includes( 'Testing instructions' ) ) {
	warn( '"Testing instructions" are missing for this PR. Please add some' );
}
