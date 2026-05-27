/**
 * `isWooCommerceActive` — synchronous read of whether WooCommerce is
 * installed on this site. Sourced from the `wp_localize_script` payload
 * (`integrations.woocommerce`) set by `class.akismet-experimental.php`.
 *
 * Not a hook — pure read of the global — but lives in `src/hooks/` so
 * imports stay grouped with the other Overview-tab data accessors.
 */
import { readGlobal } from '@/lib/is-jetpack-active';

/**
 * Whether the WooCommerce plugin is active on this site.
 *
 * @return True iff `class_exists( 'WooCommerce' )` returned true in PHP.
 */
export function isWooCommerceActive(): boolean {
	return readGlobal().integrations?.woocommerce === true;
}
