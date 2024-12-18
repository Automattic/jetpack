const debug = require( '../debug' );

/**
 * Figure out the priority of the issue, based off issue contents.
 * Logic follows this priority matrix: pfVjQF-su-p2
 *
 * @param {string} body - The issue content.
 * @return {string} Priority of issue.
 */
function findPriority( body ) {
	let priority = 'TBD';

	debug( `find-priority: Looking for priority indicators in issue body: ${ body }` );

	// Look for priority indicators in body.
	const priorityRegex =
		/###\sSite\sowner\simpact\n\n(?<impact>.*)\n\n###\sSeverity\n\n(?<severity>.*)\n\n###\sWhat\sother\simpact\(s\)\sdoes\sthis\sissue\shave\?\n\n(?<extra>.*)\n/gm;
	let match;
	while ( ( match = priorityRegex.exec( body ) ) ) {
		const { impact = '', extra = '' } = match.groups || {};
		let { severity = '' } = match.groups || {};

		debug(
			`find-priority: Reported priority indicators for issue: "${ impact }" / "${ severity }" / "${ extra }"`
		);

		// Folks can provide additional information that can bump severity.
		// We also do not want that extra information to downgrade the severity.
		if ( extra !== '' && extra !== '_No response_' && extra !== 'No revenue impact' ) {
			if (
				( extra === 'Individual site owner revenue' || extra === 'Agency or developer revenue' ) &&
				severity !== 'Critical'
			) {
				severity = 'Major';
			} else if ( extra === 'Platform revenue' ) {
				severity = 'Critical';
			}
		}

		const impactIndicators = {
			isolated: 'Less than 20% of all',
			scattered: 'Between 20% and 60% of all',
			widespread: 'More than 60% of all',
		};

		if ( severity === 'Critical' ) {
			priority = impact === impactIndicators.isolated ? 'High' : 'BLOCKER';
		} else if ( severity === 'Major' ) {
			if ( impact === impactIndicators.widespread ) {
				priority = 'BLOCKER';
			} else if ( impact === impactIndicators.scattered ) {
				priority = 'High';
			} else {
				priority = 'Normal';
			}
		} else if ( severity === 'Moderate' ) {
			if ( impact === impactIndicators.widespread ) {
				priority = 'High';
			} else if ( impact === impactIndicators.scattered ) {
				priority = 'Normal';
			} else {
				priority = 'Low';
			}
		} else if ( severity !== '' && severity !== '_No response_' ) {
			priority = impact === impactIndicators.widespread ? 'Normal' : 'Low';
		} else {
			priority = 'TBD';
		}
	}

	debug(
		`find-priority: ${
			priority === 'TBD' ? 'No ' : ' '
		}priority indicators found. Priority set to ${ priority }.`
	);
	return priority;
}

module.exports = findPriority;
