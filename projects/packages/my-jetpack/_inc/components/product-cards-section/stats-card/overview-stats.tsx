import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useId, useMemo, useState } from 'react';
import formatNumber from '../../../utils/format-number';
import formatPercentage from '../../../utils/format-percentage';
import LoadingBlock from '../../loading-block';
import { transformStatsDataForChart } from '../../stats-section/cards';
import StatsChart from '../../stats-section/stats-chart';
import styles from './overview-stats.module.scss';
import type { FC } from 'react';

type Metric = 'views' | 'visitors' | 'likes' | 'comments';

type OverviewStatsProps = {
	isLoading?: boolean;
	counts: Partial< Record< Metric, number > >;
	previousCounts?: Partial< Record< Metric, number > >;
	days: number;
	chartData: object | null;
	detailedStatsHref?: string;
	onDetailedStatsClick: () => void;
};

const CHART_COLOR = 'var(--wpds-color-stroke-interactive-brand)';

const getMetrics = (): { metric: Metric; label: string }[] => [
	{ metric: 'views', label: __( 'Views', 'jetpack-my-jetpack' ) },
	{ metric: 'visitors', label: __( 'Visitors', 'jetpack-my-jetpack' ) },
	{ metric: 'likes', label: __( 'Likes', 'jetpack-my-jetpack' ) },
	{ metric: 'comments', label: __( 'Comments', 'jetpack-my-jetpack' ) },
];

type TabProps = {
	metric: Metric;
	label: string;
	count?: number;
	isLoading: boolean;
	isSelected: boolean;
	describedBy?: string;
	onSelect: ( metric: Metric ) => void;
};

const Tab: FC< TabProps > = ( {
	metric,
	label,
	count,
	isLoading,
	isSelected,
	describedBy,
	onSelect,
} ) => {
	const handleClick = useCallback( () => onSelect( metric ), [ metric, onSelect ] );

	return (
		<Button
			variant="unstyled"
			className={ clsx( styles.tab, { [ styles[ 'is-selected' ] ]: isSelected } ) }
			aria-pressed={ isSelected }
			aria-describedby={ describedBy }
			disabled={ isLoading }
			onClick={ handleClick }
		>
			<Text variant="body-md">{ label }</Text>
			{ isLoading ? (
				<LoadingBlock width="64px" height="40px" />
			) : (
				<Text
					variant="heading-2xl"
					title={ Number.isFinite( count ) ? String( count ) : undefined }
				>
					{ formatNumber( count ?? 0 ) }
				</Text>
			) }
		</Button>
	);
};

/**
 * The whole-percent change from the previous period.
 *
 * @param {number|undefined} count    - This period's total.
 * @param {number|undefined} previous - The previous period's total.
 * @return {number|null} The change, or null with nothing to compare against.
 */
export const getPercentChange = ( count?: number, previous?: number ): number | null => {
	if ( typeof count !== 'number' || typeof previous !== 'number' || previous <= 0 ) {
		return null;
	}
	// `|| 0` turns Math.round's -0 into 0, so a tiny drop reads as no change.
	return Math.round( ( ( count - previous ) / previous ) * 100 ) || 0;
};

// `dir="auto"`: an untranslated string on an RTL site would otherwise read "8%-".
const ChangeBadge: FC< { id: string; percent: number; days: number } > = ( {
	id,
	percent,
	days,
} ) => {
	if ( percent === 0 ) {
		return (
			<Badge id={ id } intent="none" dir="auto">
				{ sprintf(
					/* translators: %d: number of days in the period. */
					_n(
						'No change compared to previous %d day',
						'No change compared to previous %d days',
						days,
						'jetpack-my-jetpack'
					),
					days
				) }
			</Badge>
		);
	}

	return (
		<Badge id={ id } intent={ percent > 0 ? 'stable' : 'medium' } dir="auto">
			{ sprintf(
				/* translators: %1$s: signed percent change, e.g. "+9%" or "-8%". %2$d: number of days in the period. */
				_n(
					'%1$s compared to previous %2$d day',
					'%1$s compared to previous %2$d days',
					days,
					'jetpack-my-jetpack'
				),
				formatPercentage( percent / 100, { style: 'percent', signDisplay: 'always' } ),
				days
			) }
		</Badge>
	);
};

/**
 * The Overview's Stats: a tab per metric with its total for the period, above an area chart of the selected one.
 *
 * @param {OverviewStatsProps} props - Component props.
 * @return {import('react').JSX.Element} The stats.
 */
const OverviewStats: FC< OverviewStatsProps > = ( {
	isLoading = false,
	counts,
	previousCounts,
	days,
	chartData,
	detailedStatsHref,
	onDetailedStatsClick,
} ) => {
	const [ selectedMetric, setSelectedMetric ] = useState< Metric >( 'views' );
	const badgeId = useId();
	const percentChange = isLoading
		? null
		: getPercentChange( counts?.[ selectedMetric ], previousCounts?.[ selectedMetric ] );
	const hasBadge = percentChange !== null;
	const series = useMemo(
		() => transformStatsDataForChart( chartData, selectedMetric, CHART_COLOR ),
		[ chartData, selectedMetric ]
	);

	return (
		<Stack direction="column" gap="lg">
			<div className={ styles.tabs } aria-busy={ isLoading }>
				{ getMetrics().map( ( { metric, label } ) => (
					<Tab
						key={ metric }
						metric={ metric }
						label={ label }
						count={ counts?.[ metric ] }
						isLoading={ isLoading }
						isSelected={ ! isLoading && selectedMetric === metric }
						describedBy={ hasBadge && selectedMetric === metric ? badgeId : undefined }
						onSelect={ setSelectedMetric }
					/>
				) ) }
			</div>
			{ hasBadge && (
				<div>
					<ChangeBadge id={ badgeId } percent={ percentChange } days={ days } />
				</div>
			) }
			<StatsChart
				data={ series }
				isLoading={ isLoading }
				href={ detailedStatsHref }
				onClick={ onDetailedStatsClick }
				selectedMetric={ selectedMetric }
				variant="area"
				fitTicks
			/>
		</Stack>
	);
};

export default OverviewStats;
