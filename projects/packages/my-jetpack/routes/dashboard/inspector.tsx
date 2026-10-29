import { useNavigate, useSearch } from '@wordpress/route';
import { useCallback } from 'react';
import { FeatureInspector } from '../../_inc/components/my-jetpack-tab-panel/features/feature-inspector';
import Providers from '../../_inc/providers';

/**
 * The open feature's details, beside the Features tab.
 *
 * @return The inspector.
 */
function Inspector() {
	// `@wordpress/route` types no route tree, so `from` and the navigate argument need a cast.
	const search: Record< string, unknown > = useSearch( { from: '/$' as never, strict: false } );
	const navigate = useNavigate();
	const close = useCallback(
		() =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( { ...prev, feature: undefined } ),
				replace: true,
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);

	// Its own React tree, so it needs the providers; they share the stage's query client.
	return (
		<Providers>
			<FeatureInspector slug={ String( search.feature ) } onClose={ close } />
		</Providers>
	);
}

export { Inspector as inspector };
