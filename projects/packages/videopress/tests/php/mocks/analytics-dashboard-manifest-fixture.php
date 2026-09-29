<?php
/**
 * Fixture manifest for the Premium Analytics registrant tests, hooked on the package's manifest
 * filter so the tests read the same entries with or without a local build.
 *
 * @package automattic/jetpack-videopress
 */

/**
 * The package's widget, as its build manifest lists it.
 *
 * @return array[]
 */
function jetpack_videopress_test_widget_manifest() {
	return array(
		array(
			'name'          => 'videopress/top-videos',
			'dir_name'      => 'top-videos',
			'title'         => 'Top videos',
			'category'      => 'stats',
			'presentation'  => 'framed',
			'render_module' => 'jetpack-videopress/widgets/top-videos/render',
			'widget_module' => 'jetpack-videopress/widgets/top-videos/widget',
			'textdomain'    => null,
		),
	);
}
