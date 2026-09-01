import { getInput } from '@actions/core';
import { LinearClient } from '@linear/sdk';
import debug from '../debug.ts';

export interface LinearIssueDetails {
	id: string;
	url: string;
	identifier: string;
}

/**
 * Create a Linear issue.
 *
 * @param title       - Issue title.
 * @param description - Issue description (markdown).
 * @param teamId      - Linear team ID to create the issue in.
 * @param apiKey      - Linear API key. Falls back to the `linear_api_key` action input when omitted.
 * @return Issue details (id, url, identifier) or null on failure.
 */
async function createLinearIssue(
	title: string,
	description: string,
	teamId: string,
	apiKey?: string
): Promise< LinearIssueDetails | null > {
	const resolvedApiKey = apiKey || getInput( 'linear_api_key' );
	if ( ! resolvedApiKey ) {
		debug( 'linear: No linear_api_key provided. Skipping issue creation.' );
		return null;
	}

	const client = new LinearClient( { apiKey: resolvedApiKey } );

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
		let errorMessage: string;
		if ( error instanceof Error ) {
			errorMessage = error.message;
		} else if ( typeof error === 'string' ) {
			errorMessage = error;
		} else {
			errorMessage = String( error );
		}
		debug( `linear: Failed to create issue: ${ errorMessage }` );
		return null;
	}
}

export default createLinearIssue;
