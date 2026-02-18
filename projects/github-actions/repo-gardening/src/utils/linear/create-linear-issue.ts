import { getInput } from '@actions/core';
import { LinearClient } from '@linear/sdk';
import debug from '../debug.ts';

/**
 * Create a Linear issue.
 *
 * @param title       - Issue title.
 * @param description - Issue description (markdown).
 * @param teamId      - Linear team ID to create the issue in.
 * @return Issue details (id, url, identifier) or null on failure.
 */
async function createLinearIssue(
	title: string,
	description: string,
	teamId: string
): Promise< { id: string; url: string; identifier: string } | null > {
	const apiKey = getInput( 'linear_api_key' );
	if ( ! apiKey ) {
		debug( 'linear: No linear_api_key provided. Skipping issue creation.' );
		return null;
	}

	const client = new LinearClient( { apiKey } );

	try {
		const issuePayload = await client.createIssue( {
			teamId,
			title,
			description,
		} );

		if ( ! issuePayload.success ) {
			debug( 'linear: Issue creation was not successful.' );
			return null;
		}

		const issue = await issuePayload.issue;
		if ( ! issue ) {
			debug( 'linear: Issue creation returned no issue.' );
			return null;
		}

		return {
			id: issue.id,
			url: issue.url,
			identifier: issue.identifier,
		};
	} catch ( error: unknown ) {
		let errorMessage;
		if ( error instanceof Error ) {
			errorMessage = error.message;
		} else if ( typeof error === 'string' ) {
			errorMessage = error;
		} else {
			errorMessage = JSON.stringify( error );
		}
		debug( `linear: Failed to create issue: ${ errorMessage }` );
		return null;
	}
}

export default createLinearIssue;
