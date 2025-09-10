import { useMemo } from 'react';
import { useGlobalChartsTheme, useGlobalChartsContext } from '../../../providers';
import type { LeaderboardEntry } from '../../../types';
import type { BaseLegendItem } from '../../legend';

/**
 * Hook to create legend items from leaderboard data
 * @param data           - Array of leaderboard entries
 * @param primaryColor   - Primary color override
 * @param secondaryColor - Secondary color override
 * @param withComparison - Whether comparison data is shown
 * @return Array of legend items for the leaderboard chart
 */
export function useLeaderboardLegendItems(
	data: LeaderboardEntry[],
	primaryColor?: string,
	secondaryColor?: string,
	withComparison: boolean = false
): BaseLegendItem[] {
	const { leaderboardChart: leaderboardChartSettings } = useGlobalChartsTheme();
	const { resolveGroupColor } = useGlobalChartsContext();

	return useMemo( () => {
		if ( ! data || data.length === 0 ) {
			return [];
		}

		const items: BaseLegendItem[] = [];

		// Add current period legend item
		const resolvedPrimaryColor = resolveGroupColor( {
			index: 0,
			overrideColor: primaryColor || leaderboardChartSettings.primaryColor,
		} );

		items.push( {
			label: withComparison ? 'Current Period' : 'Values',
			value: '',
			color: resolvedPrimaryColor,
			index: 0,
			overrideColor: primaryColor,
		} );

		// Add comparison period legend item if comparison is enabled
		if ( withComparison ) {
			const resolvedSecondaryColor = resolveGroupColor( {
				index: 1,
				overrideColor: secondaryColor || leaderboardChartSettings.secondaryColor,
			} );

			items.push( {
				label: 'Previous Period',
				value: '',
				color: resolvedSecondaryColor,
				index: 1,
				overrideColor: secondaryColor,
			} );
		}

		return items;
	}, [
		data,
		primaryColor,
		secondaryColor,
		withComparison,
		leaderboardChartSettings,
		resolveGroupColor,
	] );
}
