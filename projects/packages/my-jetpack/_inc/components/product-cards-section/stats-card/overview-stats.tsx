import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useId, useMemo, useState } from 'react';
import formatNumber from '../../../utils/format-number';
import LoadingBlock from '../../loading-block';
import { transformStatsDataForChart } from '../../stats-section/cards';
import StatsChart from '../../stats-section/stats-chart';
import ChangeBadge from './change-badge';
import styles from './overview-stats.module.scss';
import type { Metric } from './change-badge';
import type { FC } from 'react';

type OverviewStatsProps = {
	isLoading?: boolean;
	counts: Partial< Record< Metric, number > >;
	/** The totals the change badge compares, which can be shifted from `counts`. */
	comparison?: {
		counts: Partial< Record< Metric, number > >;
		previousCounts: Partial< Record< Metric, number > >;
	};
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
 * The Overview's Stats: a tab per metric with its total for the period, above an area chart of the selected one.
 *
 * @param {OverviewStatsProps} props - Component props.
 * @return {import('react').JSX.Element} The stats.
 */
const OverviewStats: FC< OverviewStatsProps > = ( {
	isLoading = false,
	counts,
	comparison,
	days,
	chartData,
	detailedStatsHref,
	onDetailedStatsClick,
} ) => {
	const [ selectedMetric, setSelectedMetric ] = useState< Metric >( 'views' );
	const badgeId = useId();
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
						describedBy={ ! isLoading && selectedMetric === metric ? badgeId : undefined }
						onSelect={ setSelectedMetric }
					/>
				) ) }
			</div>
			{ /* A row keeps the badge at its own width, and every state at one height. */ }
			<Stack direction="row">
				<ChangeBadge
					id={ badgeId }
					metric={ selectedMetric }
					count={ comparison?.counts[ selectedMetric ] }
					previous={ comparison?.previousCounts[ selectedMetric ] }
					days={ days }
					isLoading={ isLoading }
				/>
			</Stack>
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
