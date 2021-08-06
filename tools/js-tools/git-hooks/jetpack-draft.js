/* eslint-disable no-console */

/**
 * Checks if we're in draft mode and sets the draft mode flag
 */
const fs = require( 'fs' );
const chalk = require( 'chalk' );

let draftMode = false;

/**
 * Run the draft mode check
 */
function runCheckDraftMode() {
	draftMode = fs.existsSync( '.jetpack-draft' );
	if ( draftMode ) {
		console.log(
			chalk.yellow(
				"You're in draft mode. Skipping some checks. To exit draft mode, run `jetpack draft disable`."
			)
		);
	}
}

runCheckDraftMode();

module.exports = () => draftMode;
