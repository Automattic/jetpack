#!/usr/bin/env node

/* eslint-disable no-console */

const { createTokenAuth } = require( '@octokit/auth-token' );
const { Octokit } = require( '@octokit/rest' );
const chalk = require( 'chalk' );
const inquirer = require( 'inquirer' );
const sodium = require( 'libsodium-wrappers' );

/**
 * Update a secret.
 *
 * @param {Octokit} octokit - Octokit object.
 * @param {string}  slug - GitHub repo slug.
 * @param {string}  name - Secret name to create or update.
 * @param {string}  value - Value for the secret.
 * @returns {Promise} Result of the octokit.rest.actions.createOrUpdateRepoSecret call.
 */
async function updateSecret( octokit, slug, name, value ) {
	const [ owner, repo ] = slug.split( '/', 2 );
	const key = await octokit.rest.actions
		.getRepoPublicKey( {
			owner,
			repo,
		} )
		.then( res => res.data );

	const messageBytes = Buffer.from( value );
	const keyBytes = Buffer.from( key.key, 'base64' );
	await sodium.ready;
	const encryptedBytes = sodium.crypto_box_seal( messageBytes, keyBytes );
	const encrypted = Buffer.from( encryptedBytes ).toString( 'base64' );

	return octokit.rest.actions.createOrUpdateRepoSecret( {
		owner,
		repo,
		secret_name: name,
		encrypted_value: encrypted,
		key_id: key.key_id,
	} );
}

/**
 * Main.
 */
async function main() {
	const repos = process.argv.slice( 2 ).filter( repo => {
		if ( repo.match( /^[^/]+\/.+$/ ) ) {
			console.log( `Will update ${ repo }` );
			return true;
		}
		console.log( chalk.bgRed( `Invalid repo: ${ repo }` ) );
		return false;
	} );
	if ( ! repos.length ) {
		console.log( `USAGE: ${ process.argv[ 1 ] } <repo> ...` );
		return;
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

	const { name, value } = await inquirer.prompt( [
		{
			type: 'input',
			name: 'name',
			message: 'GitHub secret to create or update?',
		},
		{
			type: 'password',
			name: 'value',
			message: 'Value for the secret?',
		},
	] );

	for ( const repo of repos ) {
		console.log( `Updating ${ repo }...` );
		await updateSecret( octokit, repo, name, value )
			.then( () => console.log( chalk.green( 'Update successful!' ) ) )
			.catch( e => console.log( chalk.bgRed( `Update failed: ${ e.message }` ) ) );
	}
}

main().catch( e => console.log( chalk.bgRed( e ) ) );
