import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import formatNumber from '../../../utils/format-number';
import { transformStatsDataForChart } from '../../stats-section/cards';
import StatsChart from '../../stats-section/stats-chart';
import styles from './overview-stats.module.scss';
import type { FC } from 'react';

type Metric = 'views' | 'visitors' | 'likes' | 'comments';

type OverviewStatsProps = {
	counts: Partial< Record< Metric, number > >;
	chartData: object | null;
	detailedStatsHref?: string;
	onDetailedStatsClick: () => void;
};

// --wpds-color-stroke-interactive-brand, as a hex because SVG gradient stops can't read CSS variables.
const CHART_COLOR = '#3858e9';

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
	isSelected: boolean;
	onSelect: ( metric: Metric ) => void;
};

const Tab: FC< TabProps > = ( { metric, label, count, isSelected, onSelect } ) => {
	const handleClick = useCallback( () => onSelect( metric ), [ metric, onSelect ] );

	return (
		<Button
			variant="unstyled"
			className={ clsx( styles.tab, { [ styles[ 'is-selected' ] ]: isSelected } ) }
			aria-pressed={ isSelected }
			onClick={ handleClick }
		>
			<Text variant="body-md">{ label }</Text>
			<Text variant="heading-2xl" title={ Number.isFinite( count ) ? String( count ) : undefined }>
				{ formatNumber( count ?? 0 ) }
			</Text>
		</Button>
	);
};

/**
 * The Overview's Stats: a tab per metric with its 7-day total, above an area chart of the selected one.
 *
 * @param {OverviewStatsProps} props - Component props.
 * @return {import('react').JSX.Element} The stats.
 */
const OverviewStats: FC< OverviewStatsProps > = ( {
	counts,
	chartData,
	detailedStatsHref,
	onDetailedStatsClick,
} ) => {
	const [ selectedMetric, setSelectedMetric ] = useState< Metric >( 'views' );
	const series = useMemo(
		() => transformStatsDataForChart( chartData, selectedMetric, CHART_COLOR ),
		[ chartData, selectedMetric ]
	);

	return (
		<Stack direction="column" gap="lg">
			<div className={ styles.tabs }>
				{ getMetrics().map( ( { metric, label } ) => (
					<Tab
						key={ metric }
						metric={ metric }
						label={ label }
						count={ counts?.[ metric ] }
						isSelected={ selectedMetric === metric }
						onSelect={ setSelectedMetric }
					/>
				) ) }
			</div>
			<StatsChart
				data={ series }
				isLoading={ false }
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
