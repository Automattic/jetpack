/**
 * External dependencies
 */
import { Octokit } from '@octokit/rest';
import { createTokenAuth, createActionAuth } from '@octokit/auth';
import inquirer from 'inquirer';
import Configstore from 'configstore';

const conf = new Configstore( 'automattic/jetpack-cli' );

/**
 * Checks if a GitHub repo exists.
 *
 * @param {string} name - Repo name to check.
 * @param {string} org - Github Organization. Defaults to Automattic.
 *
 * @returns {boolean} If repo exists or not.
 */
export async function doesRepoExist( name, org = 'Automattic' ) {
	const auth = await authenticate();
	const octokit = new Octokit( { auth: auth.token } );
	return (
		octokit.repos
			.get( { owner: org, repo: name } )
			.then( resp => resp.status === 200 )
			// eslint-disable-next-line no-unused-vars
			.catch( err => false )
	);
}

/**
 * Authenticate with GitHub.
 *
 * @returns {object} GitHub auth object.
 */
async function authenticate() {
	if ( process.env.GITHUB_ACTION ) {
		const auth = createActionAuth();
		return await auth();
	}

	let token = conf.get( 'github.token' );

	if ( token ) {
		const auth = createTokenAuth( token );
		return await auth();
	}
	await inquirer
		.prompt( [
			{
				type: 'password',
				name: 'token',
				message: 'What is your GitHub Personal Token?',
			},
		] )
		.then( async answers => {
			token = answers.token;
			conf.set( 'github.token', token );
			console.log( token );
			const auth = createTokenAuth( token );
			return await auth();
		} )
		.catch( error => {
			console.error( error );
		} );
}
