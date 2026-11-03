<?php
/**
 * Test helpers for staging the widget manifest.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Callbacks for the `jetpack_premium_analytics_widgets_manifest_path` filter.
 *
 * Stage one around any first read of the widget registry: unfiltered, a local
 * build/ gets required and its manifest redeclares the fixture's stub accessor.
 */
trait Widget_Manifest_Fixture_Trait {

	/**
	 * Point the manifest require at the fixture manifest.
	 *
	 * @return string
	 */
	public function use_fixture_widget_manifest() {
		return dirname( __DIR__ ) . '/fixtures/build-entry/widgets.php';
	}

	/**
	 * Point the manifest at a missing file.
	 *
	 * @return string
	 */
	public function use_absent_widget_manifest() {
		return dirname( __DIR__ ) . '/fixtures/build-entry/no-such-widgets.php';
	}
}
