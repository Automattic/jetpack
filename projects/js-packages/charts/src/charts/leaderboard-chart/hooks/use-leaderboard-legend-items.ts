import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { useGlobalChartsTheme, useGlobalChartsContext } from '../../../providers';
import type { BaseLegendItem } from '../../../components/legend';
import type { LeaderboardEntry } from '../../../types';

/**
 * Hook to create legend items from leaderboard data
 * @param root0                         - Configuration object
 * @param root0.data                    - Array of leaderboard entries
 * @param root0.primaryColor            - Primary color override
 * @param root0.secondaryColor          - Secondary color override
 * @param root0.withComparison          - Whether comparison data is shown
 * @param root0.withOverlayLabel        - Whether to overlay the label on top of the bar
 * @param root0.legendLabels            - Custom labels for legend items
 * @param root0.legendLabels.primary    - Label for primary period data
 * @param root0.legendLabels.comparison - Label for comparison period data
 * @return Array of legend items for the leaderboard chart
 */
export function useLeaderboardLegendItems( {
	data,
	primaryColor,
	secondaryColor,
	withComparison = false,
	withOverlayLabel = false,
	legendLabels,
}: {
	data: LeaderboardEntry[];
	primaryColor?: string;
	secondaryColor?: string;
	withComparison: boolean;
	withOverlayLabel: boolean;
	legendLabels?: {
		primary?: string;
		comparison?: string;
	};
} ): BaseLegendItem[] {
	const { leaderboardChart: leaderboardChartSettings } = useGlobalChartsTheme();
	const { getElementStyles } = useGlobalChartsContext();

	return useMemo( () => {
		if ( ! data || data.length === 0 ) {
			return [];
		}

		const items: BaseLegendItem[] = [];

		// Add current period legend item
		const { color: resolvedPrimaryColor } = getElementStyles( {
			index: 0,
			overrideColor: primaryColor || leaderboardChartSettings.primaryColor,
		} );

		items.push( {
			label: legendLabels?.primary || __( 'Current period', 'jetpack-charts' ),
			color: resolvedPrimaryColor,
		} );

		// Add comparison period legend item if comparison is enabled and overlay label is not enabled
		if ( withComparison && ! withOverlayLabel ) {
			const { color: resolvedSecondaryColor } = getElementStyles( {
				index: 1,
				overrideColor: secondaryColor || leaderboardChartSettings.secondaryColor,
			} );

			items.push( {
				label: legendLabels?.comparison || __( 'Previous period', 'jetpack-charts' ),
				color: resolvedSecondaryColor,
			} );
		}

		return items;
	}, [
		data,
		primaryColor,
		secondaryColor,
		withComparison,
		legendLabels,
		leaderboardChartSettings,
		getElementStyles,
		withOverlayLabel,
	] );
}
