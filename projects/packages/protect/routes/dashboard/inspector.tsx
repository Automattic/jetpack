import { useCallback } from '@wordpress/element';
import { useNavigate, useSearch } from '@wordpress/route';
import useCloseOnEscape from './components/use-close-on-escape';
import sections from './sections';

/**
 * The sidebar of whichever section's inspector param is in the URL; Escape closes it.
 *
 * @return The section's inspector, or nothing.
 */
function Inspector() {
	// `@wordpress/route` types no route tree, so `from` and the navigate argument need a cast.
	const search: Record< string, unknown > = useSearch( { from: '/' as never, strict: false } );
	const navigate = useNavigate();
	const inspector = sections.find(
		section => section.inspector && search[ section.inspector.param ]
	)?.inspector;
	const param = inspector?.param;
	const close = useCallback( () => {
		if ( param ) {
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( { ...prev, [ param ]: undefined } ),
			} as Parameters< typeof navigate >[ 0 ] );
		}
	}, [ navigate, param ] );
	useCloseOnEscape( close );

	return inspector ? <inspector.Panel /> : null;
}

export { Inspector as inspector };
