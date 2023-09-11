import { createTokenAuth } from '@octokit/auth-token';
import { Octokit } from '@octokit/rest';
import Configstore from 'configstore';
import inquirer from 'inquirer';

const conf = new Configstore( 'automattic/jetpack-cli' );

/**
 * Checks if a GitHub repo exists.
 *
 * @param {string} name - Repo name to check.
 * @param {string} org - Github Organization. Defaults to Automattic.
 * @returns {boolean} If repo exists or not.
 */
export async function doesRepoExist( name, org = 'Automattic' ) {
	const auth = await authenticate();
	const octokit = new Octokit( { auth: auth.token } );
	return (
		octokit.rest.repos
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
	if ( process.env.MB_TOKEN ) {
		const auth = await createTokenAuth( process.env.MB_TOKEN );
		return await auth();
	}

	let token = conf.get( 'github.token' );

	if ( ! token ) {
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
			} )
			.catch( error => {
				console.error( error );
			} );
	}

	const auth = await createTokenAuth( token );
	return await auth();
}
