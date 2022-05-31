<?php
/**
 * Compatibility when Jetpack plugin doesn't exists
 *
 * @package automattic/jetpack-search-plugin
 */

namespace Automattic\Jetpack\Search_Plugin\Compatibility\NoJetpack;

/**
 * Add the "(Jetpack)" suffix to the search widget name
 *
 * This was handle from in Jetpack the plugin.
 *
 * @param string $widget_name Widget name.
 */
function jetpack_search_widget_add_suffix( $widget_name ) {
	if ( false !== strpos( '(Jetpack)', $widget_name ) ) {
		return $widget_name;
	}
	return sprintf(
		/* Translators: Placeholder is the name of a widget. */
		__( '%s (Jetpack)', 'jetpack-search' ),
		$widget_name
	);
}

if ( ! has_filter( 'jetpack_widget_name' ) ) {
	add_filter( 'jetpack_widget_name', __NAMESPACE__ . '\jetpack_search_widget_add_suffix', 10, 1 );
}
