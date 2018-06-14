/**
 * External dependencies
 */
import { danger, warn } from 'danger';

// No PR is too small to include a description of why you made a change
if ( danger.github.pr.body.length < 10 ) {
	warn( 'Please include a description of your PR changes.' );
}

// Use labels please!
if ( danger.github.issue.labels.length === 0 ) {
	warn( 'This PR is missing at least one label.' );
}
