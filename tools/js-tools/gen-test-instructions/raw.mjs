/**
 * Raw (non-AI) test instructions renderer — used when --skip-ai is passed
 * AND used as the safety-net fallback when the AI consolidation pipeline
 * fails outright.
 *
 * Output groups PRs by changelog section and either includes the explicit
 * "Testing Instructions" block from the PR body or falls back to the full
 * body. No consolidation, no inference, no environment callouts — just the
 * source material with clickable links.
 */

import { GITHUB_REPO } from './constants.mjs';

/**
 * Convert PR number references in free text into clickable GitHub links.
 *
 * @param {string} text - Text containing PR references.
 * @return {string} Text with PR numbers converted to links.
 */
export function convertPRNumbersToLinks( text ) {
	text = text.replace( /\[#(\d+)\](?!\()/g, ( _match, prNum ) => {
		return `[#${ prNum }](https://github.com/${ GITHUB_REPO }/pull/${ prNum })`;
	} );

	text = text.replace( /(?<!\[)(?<!\()PR #(\d+)\b/g, ( _match, prNum ) => {
		return `PR [#${ prNum }](https://github.com/${ GITHUB_REPO }/pull/${ prNum })`;
	} );

	text = text.replace( /(?<!\[)(?<!#)(?<!\()(?<!\/)#(\d{4,})\b/g, ( _match, prNum ) => {
		return `[#${ prNum }](https://github.com/${ GITHUB_REPO }/pull/${ prNum })`;
	} );

	return text;
}

/**
 * Generate raw (non-AI) test instructions output.
 *
 * @param {Array} entries   - Changelog entries.
 * @param {Array} prDetails - PR details with testing instructions.
 * @return {string} Markdown formatted test instructions.
 */
export function generateRawTestInstructions( entries, prDetails ) {
	let output = '# Test Instructions\n\n';
	output += `Generated on: ${ new Date().toISOString().split( 'T' )[ 0 ] }\n\n`;
	output += '## Overview\n\n';
	output +=
		'This document contains testing instructions for changes in the current release cycle.\n\n';

	const prsBySection = {};
	const prMap = new Map( prDetails.map( pr => [ pr.number.toString(), pr ] ) );

	entries.forEach( entry => {
		const section = entry.section || 'Other';
		if ( ! prsBySection[ section ] ) {
			prsBySection[ section ] = [];
		}

		const pr = prMap.get( entry.prNumber );
		if ( pr && ! prsBySection[ section ].some( p => p.number.toString() === entry.prNumber ) ) {
			prsBySection[ section ].push( pr );
		}
	} );

	Object.keys( prsBySection )
		.sort()
		.forEach( section => {
			output += `## ${ section }\n\n`;

			prsBySection[ section ].forEach( pr => {
				output += `### [${ pr.title }](https://github.com/${ GITHUB_REPO }/pull/${ pr.number }) (#${ pr.number })\n\n`;

				if ( pr.testingInstructions ) {
					const linkedInstructions = convertPRNumbersToLinks( pr.testingInstructions );
					output += `${ linkedInstructions }\n\n`;
				} else if ( pr.body ) {
					output +=
						'_No specific testing instructions section found. Full PR description below:_\n\n';
					const linkedBody = convertPRNumbersToLinks( pr.body );
					output += `${ linkedBody }\n\n`;
				} else {
					output += '_No testing instructions or PR description available._\n\n';
				}

				output += '---\n\n';
			} );
		} );

	return output;
}
