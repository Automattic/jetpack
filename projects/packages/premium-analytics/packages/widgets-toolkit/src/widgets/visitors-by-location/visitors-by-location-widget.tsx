/**
 * External dependencies
 */
import { location } from '@jetpack-premium-analytics/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { Locations } from '../../components/locations';
import { useWidgetRootContext } from '../../components/widget-root';
import { useVisitorsByLocation, type Region } from './use-visitors-by-location';
import styles from './visitors-by-location-widget.module.scss';

const UNITED_STATES = { code: 'US', name: __( 'United States', 'jetpack-premium-analytics-pkg' ) };

function isRegion( value: unknown ): value is Region {
	return value === 'US' || value === 'world';
}

/**
 * Store visitors by location: US states or countries, as the toggle says, listed beside the map.
 *
 * Must render within a WidgetRoot, which provides reportParams via context.
 */
export function VisitorsByLocationWidget() {
	const { reportParams } = useWidgetRootContext();
	const [ region, setRegion ] = useState< Region >( 'US' );

	const { rows, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useVisitorsByLocation( reportParams, region );

	return (
		<div className={ styles.root }>
			{ /* The toggle drives the query, so it stays a sibling of the kind's states. */ }
			<div className={ styles.toggle }>
				<ToggleGroupControl
					__next40pxDefaultSize
					isBlock
					hideLabelFromVision
					label={ __( 'Location', 'jetpack-premium-analytics-pkg' ) }
					onChange={ value => {
						if ( isRegion( value ) ) {
							setRegion( value );
						}
					} }
					value={ region }
				>
					<ToggleGroupControlOption
						value="US"
						label={ __( 'United States', 'jetpack-premium-analytics-pkg' ) }
					/>
					<ToggleGroupControlOption
						value="world"
						label={ __( 'Worldwide', 'jetpack-premium-analytics-pkg' ) }
					/>
				</ToggleGroupControl>
			</div>
			<div className={ styles.locations }>
				<Locations
					rows={ rows }
					status={ {
						isLoading,
						isFetching,
						// The report queries keep the previous range's data on screen, so an error only shows without it.
						isError: isError && ! hasData,
						hasComparison,
						refetch,
					} }
					error={ {
						description: __(
							"We couldn't load location data. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						icon: location,
						description: __( 'No location data in this period.', 'jetpack-premium-analytics-pkg' ),
					} }
					country={ region === 'US' ? UNITED_STATES : undefined }
				/>
			</div>
		</div>
	);
}
