const debug = require( '../debug' );
/**
 * Find platform info, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {Array} Platforms impacted by issue.
 */
function findPlatforms( body ) {
	const regex = /###\sPlatform\s\(Simple\sand\/or Atomic\)\n\n([a-zA-Z ,-]*)\n\n/gm;

	const match = regex.exec( body );
	if ( match ) {
		const [ , platforms ] = match;
		return platforms
			.split( ', ' )
			.filter( platform => platform !== 'Self-hosted' && platform.trim() !== '' );
	}

	debug( `find-platform: no platform indicators found.` );
	return [];
}

module.exports = findPlatforms;
