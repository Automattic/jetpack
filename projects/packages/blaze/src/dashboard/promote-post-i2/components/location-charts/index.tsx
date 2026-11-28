import { __ } from '@wordpress/i18n';
import { Button, Tooltip } from '@wordpress/ui';
import { useState } from 'react';
import { useLocale } from '../../../compat/utils';
import './style.scss';
import { CampaignChartCountryData } from '../../../data/promote-post/use-campaign-chart-stats-query';
import { formatNumber } from '../../utils';
import { ChartSourceOptions } from '../campaign-item-details';

type Props = {
	stats: CampaignChartCountryData[];
	total: number;
	source: ChartSourceOptions;
};

const LocationChart = ( { stats, total, source }: Props ) => {
	// Filter out the 'unknown' country from stats, we show this as a message at the end
	const filteredStats = stats.filter( stat => stat.country.toLowerCase() !== 'unknown' );
	const unknownStat = stats.find( stat => stat.country.toLowerCase() === 'unknown' );
	const [ showAll, setShowAll ] = useState( false );

	// Translation of countries
	const locale = useLocale();
	const regionNames = new Intl.DisplayNames( [ locale ], { type: 'region' } );

	// We only show the top 5 countries by default, but allow the user to show more to see the rest
	const displayedStats = showAll ? filteredStats : filteredStats.slice( 0, 5 );

	// The item with the largest percentages will have the bar at 100% width
	// The other bars will be displayed relative to (this rather than 100%)
	const maxPercentage = Math.max( ...filteredStats.map( stat => stat.percentage ) );

	return (
		<div className="location-chart__country-stats-container">
			{ displayedStats.map( ( stat, index ) => {
				// Calculate the filled bar width, relative to the most popular country
				const normalisedPercentage = ( stat.percentage / maxPercentage ) * 100;

				// Used to show the user a breakdown of the data by country
				const tooltipText = `${ formatNumber( stat.total ) } of ${ formatNumber(
					total
				) } ${ source }`;
				return (
					<Tooltip.Root key={ index }>
						<Tooltip.Trigger render={ <div className="location-chart__country-stat" /> }>
							<div className="location-chart__country-info">
								<span>{ regionNames.of( stat.country ) }</span>
								<span className="location-chart__percentage">
									{ stat.percentage > 0 ? stat.percentage : '~0' }%
								</span>
							</div>
							<div className="location-chart__progress-bar">
								{ stat.percentage > 0 && (
									<div
										className="location-chart__progress-bar-filled"
										style={ { width: `${ normalisedPercentage }%` } }
									></div>
								) }
								{ /* not needed ont the first item (since it is full width already) */ }
								{ index > 0 && <div className="location-chart__progress-bar-unfilled"></div> }
							</div>
						</Tooltip.Trigger>
						<Tooltip.Popup>{ tooltipText }</Tooltip.Popup>
					</Tooltip.Root>
				);
			} ) }
			{ unknownStat && showAll && (
				<div className="location-chart__unknown-stats-message">
					{ `${ unknownStat.percentage }% of data is from visitors whose location cannot be determined` }
				</div>
			) }
			{ filteredStats.length > 5 && (
				<Button
					variant="minimal"
					size="compact"
					className="location-chart__show-more-button"
					onClick={ () => setShowAll( ! showAll ) }
				>
					{ showAll ? __( 'Show Less', 'jetpack-blaze' ) : __( 'Show More', 'jetpack-blaze' ) }
				</Button>
			) }
		</div>
	);
};

export default LocationChart;
