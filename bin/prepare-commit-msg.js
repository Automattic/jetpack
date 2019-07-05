/* eslint-disable no-console */
const fs = require( 'fs' );

const file = fs.readFileSync( '.git/last-commit-date' );
const commitDate = file.toString();

if ( Date.now() - commitDate > 2000 /* 2sec*/ ) {
	console.log( 'WARNING: git pre-commit was hook skipped!' );
	const commitMsg = fs.readFileSync( '.git/COMMIT_EDITMSG' );
	const newCommitMsg = '[not verified] ' + commitMsg.toString();

	fs.writeFileSync( '.git/COMMIT_EDITMSG', newCommitMsg );
}
