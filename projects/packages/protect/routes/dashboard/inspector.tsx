import { useSearch } from '@wordpress/route';
import sections from './sections';

/**
 * The sidebar of whichever section's inspector param is in the URL.
 *
 * @return The section's inspector, or nothing.
 */
function Inspector() {
	// `@wordpress/route` types no route tree, so `from` needs a cast.
	const search: Record< string, unknown > = useSearch( { from: '/' as never, strict: false } );
	const Panel = sections.find( section => section.inspector && search[ section.inspector.param ] )
		?.inspector?.Panel;
	return Panel ? <Panel /> : null;
}

export { Inspector as inspector };
