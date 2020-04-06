/* eslint-disable no-console */
const fs = require( 'fs' );

fs.readFile( '.git/last-commit-date', ( err, data ) => {
	if ( err ) {
		console.log( 'skipping prepare-commit-msg hook' );
		return;
	}
	const commitDate = data.toString();

	if ( Date.now() - commitDate > 2000 /* 2sec*/ ) {
		console.log( 'WARNING: git pre-commit hook was skipped!' );
		const commitMsg = fs.readFileSync( '.git/COMMIT_EDITMSG' );
		const newCommitMsg = '[not verified] ' + commitMsg.toString();

		fs.writeFileSync( '.git/COMMIT_EDITMSG', newCommitMsg );
	}
} );
