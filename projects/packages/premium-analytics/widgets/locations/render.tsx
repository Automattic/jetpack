/**
 * External dependencies
 */
import { GeoChart, GlobalChartsProvider } from '@automattic/charts';
import {
	LeaderboardChart,
	LeaderboardLabel,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useLocationViews, { type RangeKey } from './use-location-views';
import styles from './style.module.css';
/**
 * Types
 */
import type { GeoData } from '@automattic/charts';

interface LocationsAttributes {
	range?: RangeKey;
	max?: number;
}

type LocationsRenderProps = {
	attributes?: LocationsAttributes;
};

/**
 * Flag SVG URL for a country code, served from the flag-icons CDN.
 *
 * Local copy of the widgets-toolkit `flagUrl` helper, which isn't exported
 * from the package root yet.
 *
 * @param countryCode - Two-letter ISO 3166-1 country code.
 * @return Flag SVG URL, or null for invalid codes.
 */
function flagUrl( countryCode: string ): string | null {
	if ( ! countryCode || countryCode.length !== 2 ) {
		return null;
	}

	return `https://cdn.jsdelivr.net/npm/flag-icons@7.5.0/flags/4x3/${ countryCode.toLowerCase() }.svg`;
}

/**
 * Locations widget: visitor views by country, as a world map plus a country
 * leaderboard. Ported from the Jetpack Stats Locations module (country mode),
 * presented like the Woo Analytics visitors-by-location widget.
 *
 * @param root0            - Render props.
 * @param root0.attributes - Widget attributes (range, max).
 */
export default function Locations( { attributes }: LocationsRenderProps ) {
	const range = attributes?.range ?? 'last-30-days';
	const max = attributes?.max ?? 10;

	const { data, isLoading, isSample } = useLocationViews( { range, max } );

	// Google Charts format: a header row followed by [ country, views ] rows.
	const geoData = useMemo(
		() =>
			[
				[
					__( 'Country', 'jetpack-premium-analytics' ),
					__( 'Views', 'jetpack-premium-analytics' ),
				],
				...data.map( location => [ location.countryFull, location.value ] ),
			] as unknown as GeoData,
		[ data ]
	);

	// Leaderboard rows: bar width scales against the top country (= 100%).
	// No comparison period yet, so the comparison fields stay zeroed.
	const leaderboardData = useMemo( () => {
		const maxValue = Math.max( ...data.map( location => location.value ), 0 );

		return data.map( location => {
			const imageUrl = flagUrl( location.countryCode );

			return {
				id: location.countryCode,
				label: (
					<LeaderboardLabel
						label={ location.label }
						imageAlt={ sprintf(
							/* translators: %s is the country name */
							__( 'Flag of %s', 'jetpack-premium-analytics' ),
							location.label
						) }
						{ ...( imageUrl ? { imageUrl } : {} ) }
					/>
				),
				currentValue: location.value,
				previousValue: 0,
				currentShare: maxValue > 0 ? ( location.value / maxValue ) * 100 : 0,
				previousShare: 0,
				delta: 0,
			};
		} ) as LeaderboardChartData;
	}, [ data ] );

	if ( isLoading ) {
		return (
			<Stack align="center" justify="center" className={ clsx( styles.root, styles.placeholder ) }>
				<Text>{ __( 'Loading locations…', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( ! data.length ) {
		return (
			<Stack align="center" justify="center" className={ clsx( styles.root, styles.placeholder ) }>
				<Text>
					{ __(
						'Stats on where your visitors are viewing from will appear here.',
						'jetpack-premium-analytics'
					) }
				</Text>
			</Stack>
		);
	}

	return (
		<GlobalChartsProvider>
			<Stack className={ styles.root }>
				<div className={ styles.chartArea }>
					<div className={ styles.geoChart }>
						<GeoChart data={ geoData } height={ 280 } />
					</div>
					<LeaderboardChart
						data={ leaderboardData }
						withOverlayLabel
						withComparison={ false }
						showLegend={ false }
						dataFormat={ {
							type: 'number',
							options: { useMultipliers: true, decimals: 0 },
						} }
						className={ styles.leaderboard }
					/>
				</div>
				{ isSample && (
					<Text className={ styles.sampleNote }>
						{ __( 'Sample data', 'jetpack-premium-analytics' ) }
					</Text>
				) }
			</Stack>
		</GlobalChartsProvider>
	);
}
