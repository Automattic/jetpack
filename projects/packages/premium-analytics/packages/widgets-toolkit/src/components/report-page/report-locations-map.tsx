/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { LocationsGeoChart } from '../locations-geo-chart';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
import { ReportChartSection } from './report-chart-section';
import styles from './report-locations-map.module.scss';
import type { LocationsGeoChartProps } from '../locations-geo-chart';

export interface ReportLocationsMapProps
	extends Pick< LocationsGeoChartProps, 'rows' | 'mode' | 'focusCountry' > {
	/** Whether to show the loading overlay over the map. */
	isLoading?: boolean;
}

/**
 * The Locations report's map section: views by location, with the shared
 * control that collapses it.
 *
 * @param {ReportLocationsMapProps} props - The component props.
 * @return The map section.
 */
export function ReportLocationsMap( {
	rows,
	mode,
	focusCountry,
	isLoading = false,
}: ReportLocationsMapProps ) {
	return (
		<ReportChartSection
			icon={ globe }
			title={ __( 'Views by location', 'jetpack-premium-analytics-pkg' ) }
			help={ __(
				'Views shaded by country. Pick a country on the Regions tab to see its regions instead.',
				'jetpack-premium-analytics-pkg'
			) }
			hideLabel={ __( 'Hide map', 'jetpack-premium-analytics-pkg' ) }
			showLabel={ __( 'Show map', 'jetpack-premium-analytics-pkg' ) }
		>
			<div className={ styles.map }>
				{ ( ! isLoading || rows.length > 0 ) && (
					<LocationsGeoChart rows={ rows } mode={ mode } focusCountry={ focusCountry } />
				) }
				{ isLoading && <WidgetLoadingOverlay /> }
			</div>
		</ReportChartSection>
	);
}
