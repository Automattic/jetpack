/**
 * External dependencies
 */
import {
	Locations,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
/* eslint-disable @wordpress/no-unsafe-wp-apis -- the dashboard draws its own toggles with this control. */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
/* eslint-enable @wordpress/no-unsafe-wp-apis */
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { useVisitorsByLocation, type Region } from './use-visitors-by-location';
import type { VisitorsByLocationAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type VisitorsByLocationRenderAttributes = VisitorsByLocationAttributes &
	Partial< ReportParamsFieldAttributes >;

const UNITED_STATES = { code: 'US', name: __( 'United States', 'jetpack-woocommerce-stats-pkg' ) };

/**
 * Whether a toggle value names a region.
 *
 * @param {unknown} value - The toggle value.
 * @return {boolean} Whether it is a region.
 */
function isRegion( value: unknown ): value is Region {
	return value === 'US' || value === 'world';
}

/**
 * Store visitors by location, US states or countries as the toggle says, listed beside the map,
 * read under the widget root for its report params.
 *
 * @return {JSX.Element} The toggle and the locations.
 */
function VisitorsByLocation() {
	const { reportParams } = useWidgetRootContext();
	const [ region, setRegion ] = useState< Region >( 'US' );
	const selectRegion = useCallback( ( value: unknown ) => {
		if ( isRegion( value ) ) {
			setRegion( value );
		}
	}, [] );
	const { rows, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useVisitorsByLocation( reportParams, region );

	return (
		<div className={ styles.root }>
			{ /* The toggle drives the query, so it stays a sibling of the kind's states. */ }
			<div className={ styles.toggle }>
				<ToggleGroupControl
					__next40pxDefaultSize
					isBlock
					hideLabelFromVision
					label={ __( 'Location', 'jetpack-woocommerce-stats-pkg' ) }
					onChange={ selectRegion }
					value={ region }
				>
					<ToggleGroupControlOption
						value="US"
						label={ __( 'United States', 'jetpack-woocommerce-stats-pkg' ) }
					/>
					<ToggleGroupControlOption
						value="world"
						label={ __( 'Worldwide', 'jetpack-woocommerce-stats-pkg' ) }
					/>
				</ToggleGroupControl>
			</div>
			<div className={ styles.locations }>
				<Locations
					rows={ rows }
					status={ {
						isLoading,
						isFetching,
						// The queries keep the previous range's data on screen, so an error only shows without it.
						isError: isError && ! hasData,
						hasComparison,
						refetch,
					} }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load location data. Please try again in a moment.",
							'jetpack-woocommerce-stats-pkg'
						),
						onRetry: refetch,
					} ) }
					country={ region === 'US' ? UNITED_STATES : undefined }
				/>
			</div>
		</div>
	);
}

/**
 * The Store visitors by location widget.
 *
 * @param {WidgetRenderProps< VisitorsByLocationRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function VisitorsByLocationRender( {
	attributes = {},
}: WidgetRenderProps< VisitorsByLocationRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<VisitorsByLocation />
		</WidgetRoot>
	);
}
