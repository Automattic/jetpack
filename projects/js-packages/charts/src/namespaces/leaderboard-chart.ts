/**
 * Leaderboard chart namespace
 *
 * @example
 * ```tsx
 * import { LeaderboardChart } from '@automattic/charts';
 * import type { LeaderboardChart } from '@automattic/charts';
 *
 * const props: LeaderboardChart.Props = { data };
 * <LeaderboardChart {...props} />
 * <LeaderboardChart.Unresponsive data={data} width={400} height={300} />
 * const legendItems = LeaderboardChart.useLegendItems(data);
 * ```
 */
import {
	LeaderboardChart as LeaderboardChartComponent,
	LeaderboardChartUnresponsive,
} from '../charts/leaderboard-chart';
import { useLeaderboardLegendItems } from '../charts/leaderboard-chart/hooks';
import type { LeaderboardChartProps } from '../charts/leaderboard-chart';

type LeaderboardChartNamespace = typeof LeaderboardChartComponent & {
	readonly Unresponsive: typeof LeaderboardChartUnresponsive;
	readonly useLegendItems: typeof useLeaderboardLegendItems;
};

export const LeaderboardChart: LeaderboardChartNamespace = Object.assign(
	LeaderboardChartComponent,
	{
		Unresponsive: LeaderboardChartUnresponsive,
		useLegendItems: useLeaderboardLegendItems,
	}
);

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LeaderboardChart {
	export type Props = LeaderboardChartProps;
}
