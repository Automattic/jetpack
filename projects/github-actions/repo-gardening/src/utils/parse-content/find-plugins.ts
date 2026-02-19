import debug from '../debug.ts';

/**
 * Find list of plugins impacted by issue, based off issue contents.
 *
 * @param body - The issue content.
 * @return Plugins concerned by issue.
 */
function findPlugins( body: string ): string[] {
	const regex = /###\sImpacted\splugin\n\n([a-zA-Z ,]*)\n\n/gm;

	const match = regex.exec( body );
	if ( match ) {
		const [ , plugins ] = match;
		return plugins.split( ', ' ).filter( v => v.trim() !== '' );
	}

	debug( `find-plugins: No plugin indicators found.` );
	return [];
}

export default findPlugins;
