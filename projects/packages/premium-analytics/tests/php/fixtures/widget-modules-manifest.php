<?php
/**
 * Generated-widget manifest fixture for widget registration tests.
 *
 * @package automattic/jetpack-premium-analytics
 */

/**
 * Generated-widget manifest fixture for widget registration tests.
 *
 * @return array[]
 */
function jpa_get_registered_widget_modules() {
	return array(
		array(
			'name'          => 'jpa/manifest-widget-test',
			'render_module' => '@automattic/jetpack-premium-analytics/manifest-widget-test/render',
			'widget_module' => '@automattic/jetpack-premium-analytics/manifest-widget-test/widget',
			'presentation'  => 'framed',
		),
	);
}
