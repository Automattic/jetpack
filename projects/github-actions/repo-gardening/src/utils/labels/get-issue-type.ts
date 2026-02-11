import getLabels from './get-labels.ts';
import { TYPE_LABELS_WITHOUT_PREFIX } from './type-labels.ts';
import type { OctokitClient } from '../../types.ts';

/**
 * Extract the type of the issue.
 * Issues can use 2 different types of labels to indicate type:
 * 1. Labels with a "[Type]" prefix.
 * 2. An exact set of labels without a "[Type]" prefix.
 *
 * When multiple Type labels are found, we favor labels from the hardcoded list (without prefix).
 * If multiple Type labels from the hardcoded list are found, or if no clear type can be determined,
 * we will return an empty string.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - Issue number.
 * @return Promise resolving to a string, the type of the issue, extracted from the label.
 */
async function getIssueType(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< string > {
	const labels = await getLabels( octokit, owner, repo, number );

	// Extract type labels without prefix.
	const typeLabelsWithoutPrefix = labels.filter( label =>
		TYPE_LABELS_WITHOUT_PREFIX.includes( label )
	);

	// Favor labels from the hardcoded list (without prefix).
	// If there's exactly one label from the hardcoded list, return it.
	if ( typeLabelsWithoutPrefix.length === 1 ) {
		return typeLabelsWithoutPrefix[ 0 ];
	}

	// If there are multiple labels from the hardcoded list, we cannot extract a specific type.
	if ( typeLabelsWithoutPrefix.length > 1 ) {
		return '';
	}

	// Fall back to [Type] prefixed labels if no hardcoded labels are found.
	// Extract type labels with [Type] prefix, and return them without the prefix.
	const typeLabelsWithPrefix = labels
		.filter( label => label.startsWith( '[Type]' ) )
		.map( label => label.replace( '[Type] ', '' ) );

	if ( typeLabelsWithPrefix.length === 1 ) {
		return typeLabelsWithPrefix[ 0 ];
	}

	// If there are multiple [Type] prefixed labels or no type labels at all, return empty string.
	return '';
}

export default getIssueType;
