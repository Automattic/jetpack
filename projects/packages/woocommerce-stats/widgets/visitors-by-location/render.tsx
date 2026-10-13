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
import {
	DEFAULT_REGION,
	DEFAULT_REGION_COUNTRY,
	type VisitorsByLocationAttributes,
	type Region,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type VisitorsByLocationRenderAttributes = VisitorsByLocationAttributes &
	Partial< ReportParamsFieldAttributes >;

type VisitorsByLocationProps = {
	region: Region;
};

/**
 * Store visitors by location, US states or countries as the region says, listed beside the map,
 * read under the widget root for its report params.
 *
 * @param {VisitorsByLocationProps} props - The component props.
 * @return {JSX.Element} The locations.
 */
function VisitorsByLocation( { region }: VisitorsByLocationProps ): JSX.Element {
	const { reportParams } = useWidgetRootContext();
	const { rows, hasComparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useVisitorsByLocation( reportParams, region );

	return (
		<Stack className={ styles.root } direction="column" gap="md">
			<div className={ styles.locations }>
				<Locations
					valueLabel={ __( 'Store visitors', 'jetpack-woocommerce-stats-pkg' ) }
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
					country={ region === DEFAULT_REGION ? DEFAULT_REGION_COUNTRY : undefined }
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
			<VisitorsByLocation region={ attributes.region ?? DEFAULT_REGION } />
		</WidgetRoot>
	);
}
