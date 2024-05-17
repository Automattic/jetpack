const debug = require( '../debug' );

/**
 * Find list of plugins impacted by issue, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {Array} Plugins concerned by issue.
 */
function findPlugins( body ) {
	const regex = /###\sImpacted\splugin\n\n([a-zA-Z ,]*)\n\n/gm;

	const match = regex.exec( body );
	if ( match ) {
		const [ , plugins ] = match;
		return plugins.split( ', ' ).filter( v => v.trim() !== '' );
	}

	debug( `find-plugins: No plugin indicators found.` );
	return [];
}

module.exports = findPlugins;
