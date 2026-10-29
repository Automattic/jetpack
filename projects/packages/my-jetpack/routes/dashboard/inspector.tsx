import { useNavigate } from '@wordpress/route';
import { useCallback } from 'react';
import { FeatureInspector } from '../../_inc/components/my-jetpack-tab-panel/features/feature-inspector';
import Providers from '../../_inc/providers';
import { useRouteSearch } from '../../_inc/router-bridge';
import { fromRouteSearch } from '../../_inc/utils/route-href';

/**
 * The open feature's details, beside the Features tab.
 *
 * @return The inspector.
 */
function Inspector() {
	const search = useRouteSearch();
	const navigate = useNavigate();
	const close = useCallback(
		() =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( { ...prev, feature: undefined } ),
				replace: true,
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);

	return (
		<Providers>
			<FeatureInspector
				slug={ String( search.feature ) }
				searchParams={ new URLSearchParams( fromRouteSearch( search ) ) }
				onClose={ close }
			/>
		</Providers>
	);
}

export { Inspector as inspector };
