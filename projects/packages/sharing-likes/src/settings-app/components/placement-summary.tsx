import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { PLACEMENT_ANCHOR } from '../anchors';
import { useSettings } from '../data/queries';
import { placementSummary, type SummaryFeature } from '../placement';
import { getPlacementChoices } from '../script-data';
import type { JSX } from 'react';

/**
 * Where this feature's buttons appear, and a link to change it.
 *
 * @param props         - Props.
 * @param props.feature - Feature.
 * @return Summary, or null when placement is not offered.
 */
export function PlacementSummary( { feature }: { feature: SummaryFeature } ): JSX.Element | null {
	const show = useSettings()?.show;
	if ( ! show ) {
		return null;
	}

	return (
		<Text render={ <p /> }>
			{ placementSummary( feature, show, getPlacementChoices() ) }{ ' ' }
			<Link href={ `#${ PLACEMENT_ANCHOR }` }>
				{ __( 'Change where they appear', 'jetpack-sharing-likes' ) }
			</Link>
		</Text>
	);
}
