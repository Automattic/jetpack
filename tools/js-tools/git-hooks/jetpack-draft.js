/* eslint-disable no-console */

/**
 * Checks if we're in draft mode and sets the draft mode flag
 */
const fs = require( 'fs' );
const chalk = require( 'chalk' );

let draftMode = false;

function runCheckDraftMode() {
	draftMode = fs.existsSync( '.jetpack-draft' );
	draftMode
		? console.log(
				chalk.yellow(
					"You're in draft mode. Skipping some checks. To exit draft mode, run `jetpack draft disable`."
				)
		  )
		: console.log( chalk.green( 'Draft mode disabled. All checks enabled.' ) );
}

runCheckDraftMode();

module.exports = () => draftMode;
