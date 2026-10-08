/**
 * Internal dependencies
 */
import type { DateType } from './types';

const DATE_TYPES: readonly unknown[] = [ 'created', 'paid', 'completed' ];

type WooCommerceStatsScriptData = {
	JetpackScriptData?: { woocommerce_stats?: { date_type?: unknown } };
};

/**
 * The merchant's WooCommerce Analytics date type, from the package's script data, else `paid` as in WooCommerce.
 *
 * @return The date type a store report is filtered by when its params name none.
 */
export function getSiteDateType(): DateType {
	const dateType = ( window as WooCommerceStatsScriptData ).JetpackScriptData?.woocommerce_stats
		?.date_type;

	return DATE_TYPES.includes( dateType ) ? ( dateType as DateType ) : 'paid';
}
