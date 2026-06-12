/**
 * External dependencies
 */
import { GeoChart } from '@automattic/charts';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

const numberFormatter = new Intl.NumberFormat();

/**
 * Locations widget: visitor views by country, as a world map plus a ranked
 * list. Ported from the Jetpack Stats Locations module (country mode).
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
		<Stack className={ styles.root }>
			<GeoChart data={ geoData } height={ 300 } />
			<ul className={ styles.list }>
				{ data.map( location => (
					<li key={ location.countryCode } className={ styles.row }>
						<Text className={ styles.label }>{ location.label }</Text>
						<Text className={ styles.value }>{ numberFormatter.format( location.value ) }</Text>
					</li>
				) ) }
			</ul>
			{ isSample && (
				<Text className={ styles.sampleNote }>
					{ __( 'Sample data', 'jetpack-premium-analytics' ) }
				</Text>
			) }
		</Stack>
	);
}
