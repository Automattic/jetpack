import debug from '../../utils/debug.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import findPriority from '../../utils/parse-content/find-priority.ts';
import type { OctokitClient, IssuesEvent } from '../../types.ts';

/**
 * Try to figure out the priority of the issue based off its contents and existing labels.
 *
 * @param payload - Issue event payload.
 * @param octokit - Initialized Octokit REST client.
 *
 * @return Promise resolving to an object with labels array and inferred boolean.
 */
async function getIssuePriority(
	payload: IssuesEvent,
	octokit: OctokitClient
): Promise< { labels: string[]; inferred: boolean } > {
	const {
		issue: { number, body },
		repository: {
			owner: { login: ownerLogin },
			name,
		},
	} = payload;

	const labels = await getLabels( octokit, ownerLogin, name, number );
	const priorityLabels = labels.filter(
		label => label.match( /^\[Pri\].*$/ ) && label !== '[Pri] TBD'
	);
	if ( priorityLabels.length > 0 ) {
		debug(
			`triage-issues > issue priority: Issue #${ number } has the following priority labels: ${ priorityLabels.join(
				', '
			) }`
		);
		return {
			labels: priorityLabels,
			inferred: false,
		};
	}

	// If the issue does not have Priority labels yet, let's try to infer one from the issue contents.
	debug(
		`triage-issues > issue priority: Finding priority for issue #${ number } based off the issue contents.`
	);
	const priority = findPriority( body ?? '' );
	debug(
		`triage-issues > issue priority: Priority inferred from the issue contents for issue #${ number } is ${ priority }`
	);

	return {
		labels: [ `[Pri] ${ priority }` ],
		inferred: true,
	};
}

export default getIssuePriority;
