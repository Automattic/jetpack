/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Display labels for the keys `stats/devices/screensize` returns.
 *
 * Shared so the two widgets that render this property — Devices and Top
 * platforms — cannot drift apart, and so translators see each string once.
 * Keys outside this map are title-cased by `formatDisplayLabel`.
 */
export const SCREEN_SIZE_LABELS: Record< string, string > = {
	desktop: __( 'Desktop', 'jetpack-premium-analytics-pkg' ),
	mobile: __( 'Mobile', 'jetpack-premium-analytics-pkg' ),
	tablet: __( 'Tablet', 'jetpack-premium-analytics-pkg' ),
	phone: __( 'Phone', 'jetpack-premium-analytics-pkg' ),
	other: __( 'Other', 'jetpack-premium-analytics-pkg' ),
	unknown: __( 'Unknown', 'jetpack-premium-analytics-pkg' ),
};
