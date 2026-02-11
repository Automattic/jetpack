import debug from '../debug.ts';

/**
 * Find platform info, based off issue contents.
 *
 * @param body - The issue content.
 * @return Platforms impacted by issue.
 */
function findPlatforms( body: string ): string[] {
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

export default findPlatforms;
