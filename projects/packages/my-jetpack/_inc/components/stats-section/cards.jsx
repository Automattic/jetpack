import { sprintf, __, _n } from '@wordpress/i18n';
import { Icon, commentContent, people, starEmpty, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useCallback } from 'react';
import formatNumber from '../../utils/format-number';
import CountComparisonCard from './count-comparison-card';
import createStatDiffText from './create-stat-diff-text';
import eye from './eye';
import StatsChart from './stats-chart';
import styles from './style.module.scss';

/**
 * Creates the text read by screen readers for a stat card.
 *
 * @param {Function} countStat     - Function that accepts a number and calls _n() with that number to return the singular or plural form of the stat count.
 *                                 E.g. countStat( 1 ) returns '%s view', countStat( 5 ) returns '%s views'
 * @param {number}   count         - The current count value.
 * @param {number}   previousCount - The previous period's count value.
 * @return {string} Screen reader text
 */

const createStatSRText = ( countStat, count, previousCount ) => {
	if ( typeof count !== 'number' ) {
		return '';
	}

	const fragments = [];
	const statCountText = sprintf( countStat( count ), formatNumber( count ) );

	fragments.push( statCountText.endsWith( '.' ) ? statCountText : `${ statCountText }.` );
	fragments.push( createStatDiffText( countStat, count, previousCount ) );

	return fragments.filter( Boolean ).join( ' ' );
};

/**
 * Get the display label for a metric
 *
 * @param {string} metric - The metric name (views, visitors, likes, comments)
 * @return {string} The translated display label
 */
const getMetricLabel = metric => {
	const labels = {
		views: __( 'Views', 'jetpack-my-jetpack' ),
		visitors: __( 'Visitors', 'jetpack-my-jetpack' ),
		likes: __( 'Likes', 'jetpack-my-jetpack' ),
		comments: __( 'Comments', 'jetpack-my-jetpack' ),
	};
	return labels[ metric ] || metric;
};

/**
 * Transforms WordPress.com API stats data to BarChart SeriesData format for a single metric
 *
 * @param {object} apiData        - Data from WordPress.com stats API with fields and data arrays
 * @param {string} selectedMetric - The metric to display (views, visitors, likes, comments)
 * @return {Array} SeriesData array formatted for BarChart component
 */
const transformStatsDataForChart = ( apiData, selectedMetric = 'views' ) => {
	if ( ! apiData || ! apiData.fields || ! apiData.data || ! Array.isArray( apiData.data ) ) {
		return [];
	}

	const { fields, data } = apiData;

	// Find the index of the period and selected metric
	const periodIndex = fields.indexOf( 'period' );
	const metricIndex = fields.indexOf( selectedMetric );

	// If either index is not found, we can't process the data
	if ( periodIndex === -1 || metricIndex === -1 ) {
		return [];
	}

	// Return single series data for the selected metric
	return [
		{
			label: getMetricLabel( selectedMetric ),
			data: data.map( dataPoint => ( {
				date: new Date( dataPoint[ periodIndex ] + 'T00:00:00' ), // This ensures the date represents midnight in the local timezone rather than UTC midnight converted to local time.
				value: dataPoint[ metricIndex ] || 0,
			} ) ),
			options: {
				stroke: '#008710', // Jetpack green (--jp-green-50) #008710
			},
		},
	];
};

/**
 * Get the dynamic title based on selected metric
 *
 * @param {string} metric - The selected metric
 * @return {string} The translated title
 */
const getDynamicTitle = metric => {
	const titles = {
		views: __( 'Views in the last 7 days', 'jetpack-my-jetpack' ),
		visitors: __( 'Visitors in the last 7 days', 'jetpack-my-jetpack' ),
		likes: __( 'Likes in the last 7 days', 'jetpack-my-jetpack' ),
		comments: __( 'Comments in the last 7 days', 'jetpack-my-jetpack' ),
	};
	return titles[ metric ] || titles.views;
};

/**
 * Stats cards component.
 *
 * @param {object}   props                      - Component props.
 * @param {object}   props.counts               - Counts object for the current period.
 * @param {object}   props.previousCounts       - Counts object for the previous period.
 * @param {number}   props.headingLevel         - Heading level between 1 and 6.
 * @param {Array}    props.chartData            - Chart data for the bar chart visualization.
 * @param {boolean}  props.isLoading            - Whether the data is loading.
 * @param {Function} props.onDetailedStatsClick - Function to handle detailed stats click.
 *
 * @return {object} StatsCards React component.
 */
const StatsCards = ( {
	counts,
	previousCounts,
	headingLevel,
	chartData,
	isLoading,
	onDetailedStatsClick,
} ) => {
	const Heading = `h${ headingLevel >= 1 && headingLevel <= 6 ? headingLevel : 3 }`;

	// State for selected metric (default to 'views')
	const [ selectedMetric, setSelectedMetric ] = useState( 'views' );

	// Transform the API data to BarChart format for selected metric
	const transformedChartData = transformStatsDataForChart( chartData, selectedMetric );

	// Handle metric selection
	const handleMetricSelect = useCallback( metric => {
		setSelectedMetric( metric );
	}, [] );

	// Individual handlers for each metric to avoid arrow functions in JSX
	const handleViewsClick = useCallback(
		() => handleMetricSelect( 'views' ),
		[ handleMetricSelect ]
	);
	const handleVisitorsClick = useCallback(
		() => handleMetricSelect( 'visitors' ),
		[ handleMetricSelect ]
	);
	const handleLikesClick = useCallback(
		() => handleMetricSelect( 'likes' ),
		[ handleMetricSelect ]
	);
	const handleCommentsClick = useCallback(
		() => handleMetricSelect( 'comments' ),
		[ handleMetricSelect ]
	);

	const handleKeyDown = useCallback(
		e => {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				onDetailedStatsClick();
			}
		},
		[ onDetailedStatsClick ]
	);

	// Get icon for selected metric
	const getMetricIcon = useCallback( metric => {
		const icons = {
			views: <Icon icon={ eye } />,
			visitors: <Icon icon={ people } />,
			likes: <Icon icon={ starEmpty } />,
			comments: <Icon icon={ commentContent } />,
		};
		return icons[ metric ] || icons.views;
	}, [] );

	return (
		<div className={ styles[ 'section-stats-highlights' ] }>
			<div
				className={ styles[ 'section-title-container' ] }
				onClick={ onDetailedStatsClick }
				role="button"
				tabIndex={ 0 }
				onKeyDown={ handleKeyDown }
			>
				<Heading className={ styles[ 'section-title' ] }>
					<span>{ getDynamicTitle( selectedMetric ) }</span>
				</Heading>
				<div>
					<Icon icon={ chevronRight } />
				</div>
			</div>

			<StatsChart
				data={ transformedChartData }
				isLoading={ isLoading }
				onClick={ onDetailedStatsClick }
				onKeyDown={ handleKeyDown }
				selectedMetric={ selectedMetric }
				metricIcon={ getMetricIcon( selectedMetric ) }
			/>

			<ul className={ clsx( styles[ 'cards-list' ], styles[ 'my-jetpack-stats-cards' ] ) }>
				<CountComparisonCard
					heading={ __( 'Views', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of views
						count => _n( '%s view', '%s views', count, 'jetpack-my-jetpack' ),
						counts?.views,
						previousCounts?.views
					) }
					icon={ <Icon icon={ eye } /> }
					count={ counts?.views }
					previousCount={ previousCounts?.views }
					as="li"
					isSelected={ selectedMetric === 'views' }
					onClick={ handleViewsClick }
				/>
				<CountComparisonCard
					heading={ __( 'Visitors', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of visitors
						count => _n( '%s visitor', '%s visitors', count, 'jetpack-my-jetpack' ),
						counts?.visitors,
						previousCounts?.visitors
					) }
					icon={ <Icon icon={ people } /> }
					count={ counts?.visitors }
					previousCount={ previousCounts?.visitors }
					as="li"
					isSelected={ selectedMetric === 'visitors' }
					onClick={ handleVisitorsClick }
				/>
				<CountComparisonCard
					heading={ __( 'Likes', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of likes
						count => _n( '%s like', '%s likes', count, 'jetpack-my-jetpack' ),
						counts?.likes,
						previousCounts?.likes
					) }
					icon={ <Icon icon={ starEmpty } /> }
					count={ counts?.likes }
					previousCount={ previousCounts?.likes }
					as="li"
					isSelected={ selectedMetric === 'likes' }
					onClick={ handleLikesClick }
				/>
				<CountComparisonCard
					heading={ __( 'Comments', 'jetpack-my-jetpack' ) }
					srText={ createStatSRText(
						// translators: %s: number of comments
						count => _n( '%s comment', '%s comments', count, 'jetpack-my-jetpack' ),
						counts?.comments,
						previousCounts?.comments
					) }
					icon={ <Icon icon={ commentContent } /> }
					count={ counts?.comments }
					previousCount={ previousCounts?.comments }
					as="li"
					isSelected={ selectedMetric === 'comments' }
					onClick={ handleCommentsClick }
				/>
			</ul>
		</div>
	);
};

export default StatsCards;
