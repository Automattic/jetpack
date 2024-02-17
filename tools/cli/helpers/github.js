import { createTokenAuth } from '@octokit/auth-token';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import Configstore from 'configstore';
import enquirer from 'enquirer';

const conf = new Configstore( 'automattic/jetpack-cli' );

/**
 * Checks if a GitHub repo exists.
 *
 * @param {string} name - Repo name to check.
 * @param {string} org - Github Organization. Defaults to Automattic.
 * @returns {boolean} If repo exists or not.
 */
export async function doesRepoExist( name, org = 'Automattic' ) {
	let forceToken = false;
	// eslint-disable-next-line no-constant-condition
	while ( true ) {
		try {
			const auth = await getAuthToken( forceToken );
			const octokit = new Octokit( { auth: auth.token } );
			const resp = await octokit.rest.repos.get( { owner: org, repo: name } );
			return resp.status === 200;
		} catch ( e ) {
			if ( e.status === 404 ) {
				return false;
			} else if ( e.status === 401 ) {
				forceToken = true;
				console.error( chalk.red( 'GitHub access token is invalid!' ) );
			} else {
				console.error( chalk.red( 'Failed to check repo existence: ' + e.message ) );
				return false;
			}
		}
	}
}

/**
 * Authenticate with GitHub.
 *
 * @param {boolean} force - Force querying for an auth token.
 * @returns {object} GitHub auth object.
 */
async function getAuthToken( force ) {
	if ( ! force && process.env.MB_TOKEN ) {
		const auth = await createTokenAuth( process.env.MB_TOKEN );
		return await auth();
	}

	let token = conf.get( 'github.token' );

	if ( force || ! token ) {
		await enquirer
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
