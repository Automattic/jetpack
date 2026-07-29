import { SelectControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { getGreeting } from './greeting';
import { type ChartGranularity, type StatsPeriod } from './stats/placeholder-data';
import { RecentPosts } from './stats/recent-posts';
import { StatBar } from './stats/stat-bar';
import { SubscribersChart } from './stats/subscribers-chart';
import { useEmailPerformanceStats } from './stats/use-email-performance-stats';
import { useSubscriberStats } from './stats/use-subscriber-stats';

/**
 * How far back the page is looking.
 *
 * A function rather than a module constant so each `__()` runs at render time.
 *
 * @return The period options.
 */
const getPeriods = (): Array< { value: StatsPeriod; label: string } > => [
	{ value: '7d', label: __( '7 days', 'jetpack-newsletter' ) },
	{ value: '30d', label: __( '30 days', 'jetpack-newsletter' ) },
	{ value: '90d', label: __( '90 days', 'jetpack-newsletter' ) },
	{ value: 'year', label: __( 'Year', 'jetpack-newsletter' ) },
];

/**
 * The stats view — what the Dashboard becomes once a newsletter has an audience:
 * headline figures, subscribers over time, and recent posts with how each one
 * performed.
 *
 * Subscriber totals and email performance are real Stats data.
 *
 * @return The stats content.
 */
export const StatsView = (): JSX.Element => {
	const [ period, setPeriod ] = useState< StatsPeriod >( '30d' );
	const [ granularity, setGranularity ] = useState< ChartGranularity >( 'days' );
	const subscriberStats = useSubscriberStats( period, granularity );
	const emailPerformanceStats = useEmailPerformanceStats( period );

	const handlePeriod = useCallback( ( next: string ) => setPeriod( next as StatsPeriod ), [] );

	return (
		<Stack
			direction="column"
			gap="xl"
			className="jetpack-newsletter-home jetpack-newsletter-home--wide"
		>
			<div className="jetpack-newsletter-home__stats-header">
				<Text variant="heading-2xl" render={ <h1 /> }>
					{ getGreeting() }
				</Text>
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Period', 'jetpack-newsletter' ) }
					hideLabelFromVision
					value={ period }
					options={ getPeriods() }
					onChange={ handlePeriod }
					className="jetpack-newsletter-home__period"
				/>
			</div>

			<StatBar
				totalSubscribers={ subscriberStats.totalSubscribers }
				openRate={ emailPerformanceStats.openRate }
				clickRate={ emailPerformanceStats.clickRate }
				ctor={ emailPerformanceStats.ctor }
			/>

			<SubscribersChart
				granularity={ granularity }
				onChangeGranularity={ setGranularity }
				series={ subscriberStats.series }
				isLoading={ subscriberStats.isLoading }
			/>

			<RecentPosts />
		</Stack>
	);
};
