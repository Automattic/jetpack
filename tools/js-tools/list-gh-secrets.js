#!/usr/bin/env node

/* eslint-disable no-console */

const fs = require( 'fs' );
const path = require( 'path' );
const { createTokenAuth } = require( '@octokit/auth-token' );
const { Octokit } = require( '@octokit/rest' );
const chalk = require( 'chalk' );
const glob = require( 'glob' );
const inquirer = require( 'inquirer' );

/**
 * List secrets.
 *
 * @param {Octokit} octokit - Octokit object.
 * @param {string}  slug - GitHub repo slug.
 * @returns {Promise} Empty
 */
async function listSecrets( octokit, slug ) {
	const [ owner, repo ] = slug.split( '/', 2 );

	for await ( const response of octokit.paginate.iterator( octokit.rest.actions.listRepoSecrets, {
		owner,
		repo,
		per_page: 100,
	} ) ) {
		response.data.forEach( secret =>
			console.log(
				// prettier-ignore
				`${ chalk.green( slug ) }\t${ chalk.cyan( secret.name ) }\tlast updated ${ secret.updated_at }`
			)
		);
	}
}

/**
 * Main.
 */
async function main() {
	let repos;
	if ( process.argv.length > 2 ) {
		repos = process.argv.slice( 2 ).filter( repo => {
			if ( repo.match( /^[^/]+\/.+$/ ) ) {
				return true;
			}
			console.log( chalk.bgRed( `Invalid repo: ${ repo }` ) );
			return false;
		} );
		if ( ! repos.length ) {
			console.log( `USAGE: ${ process.argv[ 1 ] } [<repo> ...]` );
			return;
		}
	} else {
		repos = [];
		repos = glob
			.sync( 'projects/*/*/composer.json', {
				cwd: path.resolve( __dirname, '../..' ),
			} )
			.flatMap( file => {
				const data = JSON.parse( fs.readFileSync( file, 'utf8' ) );
				if ( data.extra && data.extra[ 'mirror-repo' ] ) {
					return [ data.extra[ 'mirror-repo' ] ];
				}
				return [];
			} )
			.sort();
		repos.unshift( 'Automattic/jetpack' );
	}

	let token = process.env.GITHUB_TOKEN;
	if ( ! token ) {
		token = await inquirer
			.prompt( [
				{
					type: 'password',
					name: 'token',
					message: 'What is your GitHub Personal Token?',
				},
			] )
			.then( answers => answers.token );
	}
	const auth = await createTokenAuth( token );
	const octokit = new Octokit( { auth: ( await auth() ).token } );

	for ( const repo of repos ) {
		await listSecrets( octokit, repo );
	}
}

main().catch( e => console.log( chalk.bgRed( e ) ) );
