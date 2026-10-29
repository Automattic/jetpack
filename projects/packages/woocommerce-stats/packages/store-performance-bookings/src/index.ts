/**
 * External dependencies
 */
import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
/**
 * Internal dependencies
 */
import { registerBookingsMetric } from './bookings-metric';

// Registered once this bundle's catalog is in, so the metric's strings are translated; Store
// performance reads the filter again when it is added.
loadI18nCatalogs( 'jetpack-woocommerce-stats-pkg', import.meta.url ).finally(
	registerBookingsMetric
);
