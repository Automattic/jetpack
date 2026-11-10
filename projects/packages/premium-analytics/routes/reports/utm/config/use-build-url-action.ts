/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Action } from '@jetpack-premium-analytics/externals';
import type { UtmReportRow, UtmUrlBuilderValues } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * The UTM report's Build URL row action, which opens the builder pre-filled from the row.
 *
 * @param onOpen - Opens the builder with the row's values.
 * @return The row action.
 */
export function useBuildUrlAction(
	onOpen: ( values: Partial< UtmUrlBuilderValues > ) => void
): Action< UtmReportRow > {
	return useMemo(
		() => ( {
			id: 'build-url',
			label: __( 'Build URL', 'jetpack-premium-analytics-pkg' ),
			isEligible: item => !! item.urlBuilder,
			callback: ( [ item ] ) => {
				if ( item.urlBuilder ) {
					onOpen( item.urlBuilder );
				}
			},
		} ),
		[ onOpen ]
	);
}
