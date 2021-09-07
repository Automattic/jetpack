/* eslint-disable no-console */
const execSync = require( 'child_process' ).execSync;
const fs = require( 'fs' );

const notVerifiedPrefix = '[not verified] ';

fs.readFile( '.git/last-commit-tree', ( err, data ) => {
	if ( err ) {
		console.log( 'skipping prepare-commit-msg hook' );
		return;
	}
	const commitTree = data.toString();
	const curTree = execSync( 'git write-tree' ).toString();

	const commitMsg = fs.readFileSync( '.git/COMMIT_EDITMSG' ).toString();
	let newCommitMsg = null;
	if ( commitTree !== curTree ) {
		console.log( 'WARNING: git pre-commit hook was skipped!' );
		if ( ! commitMsg.startsWith( notVerifiedPrefix ) ) {
			newCommitMsg = notVerifiedPrefix + commitMsg;
		}
	} else if ( commitMsg.startsWith( notVerifiedPrefix ) ) {
		// Ideally we'd remove the tag here, but to reliably do that we'd have to have
		// pre-commit-hook.js check all files in --amend instead of only the ones being
		// changed in the amendment. So for now, don't do it.
		//
		// newCommitMsg = commitMsg.substring( notVerifiedPrefix.length );
	}
	if ( null !== newCommitMsg ) {
		fs.writeFileSync( '.git/COMMIT_EDITMSG', newCommitMsg );
	}
} );
