import { __ } from '@wordpress/i18n';
import { flagEmoji } from './flag-emoji';
import RankingCard, { type RankingItem } from './ranking-card';
import type { TopLocation } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	locations: TopLocation[];
	isLoading: boolean;
};

/**
 * "Top locations" card. Rows are not links and there is no
 * "See all locations" footer (no such route exists yet — Phase 6 may
 * add it).
 *
 * @param props           - Component props.
 * @param props.locations - Top countries for the active range.
 * @param props.isLoading - When true, renders skeleton rows so the card
 *                        height does not collapse.
 * @return The card element.
 */
export default function TopLocationsCard( { locations, isLoading }: Props ): ReactElement {
	const items: RankingItem[] = locations.map( l => ( {
		key: l.countryCode,
		label: (
			<>
				<span aria-hidden="true" className="vp-overview__flag">
					{ flagEmoji( l.countryCode ) }
				</span>
				{ l.countryName }
			</>
		),
		value: l.views,
	} ) );

	return (
		<RankingCard
			title={ __( 'Top locations', 'jetpack-videopress-pkg' ) }
			ariaLabel={ __( 'Top viewer locations', 'jetpack-videopress-pkg' ) }
			columnHeader={ __( 'COUNTRIES', 'jetpack-videopress-pkg' ) }
			items={ items }
			isLoading={ isLoading }
		/>
	);
}
