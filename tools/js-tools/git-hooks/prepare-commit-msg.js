/* eslint-disable no-console */
const execSync = require( 'child_process' ).execSync;
const fs = require( 'fs' );

const notVerifiedPrefix = '[not verified] ';

// .git folder location varies if this repo is used a submodule. Also, remove trailing new-line.
const gitFolderPath = execSync( 'git rev-parse --git-dir' ).toString().replace( /\n$/, '' );

fs.readFile( `${ gitFolderPath }/last-commit-tree`, ( err, data ) => {
	if ( err ) {
		console.log( 'skipping prepare-commit-msg hook' );
		return;
	}
	const commitTree = data.toString();
	const curTree = execSync( 'git write-tree' ).toString();

	const commitMsg = fs.readFileSync( `${ gitFolderPath }/COMMIT_EDITMSG` ).toString();
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
		fs.writeFileSync( `${ gitFolderPath }/COMMIT_EDITMSG`, newCommitMsg );
	}
} );
