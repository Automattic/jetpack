<?php
/**
 * Fixture manifest for the Premium Analytics registrant tests, hooked on the dashboard's
 * registrable-types filter so the tests read the same entries with or without a local build.
 *
 * @package automattic/jetpack-videopress
 */

/**
 * The package's widgets, as its build manifest lists them.
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
		array(
			'name'          => 'videopress/video-player',
			'dir_name'      => 'video-player',
			'title'         => 'Video',
			'category'      => 'stats',
			'presentation'  => 'full-bleed',
			'render_module' => 'jetpack-videopress/widgets/video-player/render',
			'widget_module' => 'jetpack-videopress/widgets/video-player/widget',
			'textdomain'    => null,
		),
	);
}
