/** A plugin that uses the Jetpack connection, as listed in the connection state. */
export interface ConnectedPlugin {
	slug: string;
	name: string;
}

/**
 * The connected plugins from the store, which holds a WP_Error object when the list can't be read.
 *
 * @param value - The raw `getConnectedPlugins()` value.
 * @return The plugins with a slug; a missing name falls back to the slug.
 */
export function toConnectedPlugins( value: unknown ): ConnectedPlugin[] {
	if ( ! Array.isArray( value ) ) {
		return [];
	}
	const plugins: ConnectedPlugin[] = [];
	for ( const item of value ) {
		if ( item && typeof item === 'object' && 'slug' in item && typeof item.slug === 'string' ) {
			const name = 'name' in item && typeof item.name === 'string' && item.name ? item.name : '';
			plugins.push( { slug: item.slug, name: name || item.slug } );
		}
	}
	return plugins;
}

/**
 * Whether a WooCommerce-family plugin is connected, which makes the site a "store" in the copy.
 *
 * @param plugins - The connected plugins.
 * @return Whether one is a WooCommerce plugin.
 */
export function hasWooPlugin( plugins: ConnectedPlugin[] ): boolean {
	return plugins.some( plugin => plugin.slug.startsWith( 'woocommerce' ) );
}

/**
 * Whether a Jetpack-family plugin is connected, so Jetpack features such as Stats can be named.
 *
 * @param plugins - The connected plugins.
 * @return Whether one is a Jetpack plugin.
 */
export function hasJetpackPlugin( plugins: ConnectedPlugin[] ): boolean {
	return plugins.some(
		plugin => plugin.slug === 'jetpack' || plugin.slug.startsWith( 'jetpack-' )
	);
}
