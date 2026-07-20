/**
 * External dependencies
 */
import { GeoChart } from '@automattic/charts';
import { location } from '@jetpack-premium-analytics/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
import { WidgetState } from '../../components';
import { LeaderboardChart, LeaderboardLabel } from '../../components/chart-leaderboard';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import { flagUrl } from '../../helpers';
import { useVisitorsByLocation, type Region } from './use-visitors-by-location';
import styles from './visitors-by-location-widget.module.scss';

function isRegion( value: unknown ): value is Region {
	return value === 'US' || value === 'world';
}

export function VisitorsByLocationWidget() {
	const { reportParams } = useWidgetRootContext();
	const [ region, setRegion ] = useState< Region >( 'US' );

	const {
		geoData,
		leaderboardData,
		isLoading,
		isFetching,
		hasData,
		hasComparison,
		isError,
		refetch,
	} = useVisitorsByLocation( reportParams, region );

	const leaderboardDataWithImages = useMemo(
		() =>
			leaderboardData.map( item => {
				const imageUrl = flagUrl( region === 'US' ? 'us' : item.id );
				const labelText = typeof item.label === 'string' ? item.label : '';
				const imageAlt =
					region === 'US'
						? __( 'United States flag', 'jetpack-premium-analytics' )
						: sprintf(
								/* translators: %s is the country name */
								__( 'Flag of %s', 'jetpack-premium-analytics' ),
								labelText
						  );

				return {
					...item,
					label: (
						<LeaderboardLabel
							label={ labelText }
							imageAlt={ imageAlt }
							imageClassName={ styles.leaderboardImage }
							{ ...( imageUrl ? { imageUrl } : {} ) }
						/>
					),
				};
			} ),
		[ leaderboardData, region ]
	);

	const geoChartProps =
		region === 'US'
			? ( {
					region,
					resolution: 'provinces',
			  } as const )
			: {};

	const geoChart = (
		<GeoChart data={ geoData } resizeDebounceTime={ RESIZE_DEBOUNCE_MS } { ...geoChartProps } />
	);

	return (
		<div className={ styles.root }>
			<div className={ styles.container }>
				{ /* The region toggle drives the query, so it stays available in
				     every state (a sibling of WidgetState, per the widget contract). */ }
				<div className={ styles.toggleControl }>
					<ToggleGroupControl
						__next40pxDefaultSize
						isBlock
						hideLabelFromVision
						label={ __( 'Location', 'jetpack-premium-analytics' ) }
						onChange={ value => {
							if ( isRegion( value ) ) {
								setRegion( value );
							}
						} }
						value={ region }
					>
						<ToggleGroupControlOption
							value="US"
							label={ __( 'United States', 'jetpack-premium-analytics' ) }
						/>
						<ToggleGroupControlOption
							value="world"
							label={ __( 'Worldwide', 'jetpack-premium-analytics' ) }
						/>
					</ToggleGroupControl>
				</div>

				<WidgetState
					isLoading={ isLoading && ! hasData }
					isFetching={ isFetching }
					// The report queries keep the previous period's data as placeholders
					// across range changes, so only surface the error when there is
					// nothing to show.
					isError={ isError && ! hasData }
					isEmpty={ leaderboardData.length === 0 }
					error={ {
						description: __(
							"We couldn't load location data. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
					} }
					empty={ {
						icon: location,
						description: __( 'No location data in this period.', 'jetpack-premium-analytics' ),
					} }
				>
					<LeaderboardChart
						data={ leaderboardDataWithImages }
						withOverlayLabel={ true }
						withComparison={ hasComparison }
						showLegend={ false }
						dataFormat={ {
							type: 'number',
							options: { useMultipliers: true, decimals: 0 },
						} }
						className={ styles.leaderboardChart }
					/>

					<div className={ styles.geoChart }>{ geoChart }</div>
				</WidgetState>
			</div>
		</div>
	);
}
