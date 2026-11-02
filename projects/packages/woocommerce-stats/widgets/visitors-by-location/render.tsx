/**
 * External dependencies
 */
import {
	Locations,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	Stack,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { useVisitorsByLocation } from './use-visitors-by-location';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { JSX } from 'react';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type VisitorsByLocationAttributes = Record< never, never >;

type VisitorsByLocationRenderAttributes = VisitorsByLocationAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Store visitors by location, countries listed beside the world map, read under the widget root
 * for its report params.
 *
 * @return {JSX.Element} The locations.
 */
function VisitorsByLocation(): JSX.Element {
	const { reportParams } = useWidgetRootContext();
	const { rows, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useVisitorsByLocation( reportParams );

	return (
		<Stack className={ styles.root } direction="column">
			<div className={ styles.locations }>
				<Locations
					valueLabel={ __( 'Store visitors', 'jetpack-woocommerce-stats-pkg' ) }
					chartTitle={ __( 'Store visitors by location', 'jetpack-woocommerce-stats-pkg' ) }
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
				/>
			</div>
		</Stack>
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
}: WidgetRenderProps< VisitorsByLocationRenderAttributes > ): JSX.Element {
	return (
		<WidgetRoot attributes={ attributes }>
			<VisitorsByLocation />
		</WidgetRoot>
	);
}
