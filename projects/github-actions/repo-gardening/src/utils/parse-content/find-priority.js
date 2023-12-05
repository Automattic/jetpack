const debug = require( '../debug' );

/**
 * Figure out the priority of the issue, based off issue contents.
 * Logic follows this priority matrix: pciE2j-oG-p2
 *
 * @param {string} body - The issue content.
 * @returns {string} Priority of issue.
 */
function findPriority( body ) {
	// Look for priority indicators in body.
	const priorityRegex =
		/###\sImpact\n\n(?<impact>.*)\n\n###\sAvailable\sworkarounds\?\n\n(?<blocking>.*)\n/gm;
	let match;
	while ( ( match = priorityRegex.exec( body ) ) ) {
		const [ , impact = '', blocking = '' ] = match;

		debug(
			`find-priority: Reported priority indicators for issue: "${ impact }" / "${ blocking }"`
		);

		if ( blocking === 'No and the platform is unusable' ) {
			return impact === 'One' ? 'High' : 'BLOCKER';
		} else if ( blocking === 'No but the platform is still usable' ) {
			return 'High';
		} else if ( blocking === 'Yes, difficult to implement' ) {
			return impact === 'All' ? 'High' : 'Normal';
		} else if ( blocking !== '' && blocking !== '_No response_' ) {
			return impact === 'All' || impact === 'Most (> 50%)' ? 'Normal' : 'Low';
		}
		return 'TBD';
	}

	debug( `find-priority: No priority indicators found.` );
	return 'TBD';
}

module.exports = findPriority;
