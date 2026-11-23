<?php
/**
 * Tests for Safeguard's WordPress.org plugin lookup.
 *
 * @package wpcomsh
 */

/**
 * Safeguard plugin lookup tests.
 */
class SafeguardPluginLookupTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_returns_original_http_error() {
		$slug       = 'hello-dolly';
		$lookup_url = Safeguard\DOTORG_PLUGIN_INFO_ENDPOINT . $slug;
		$error      = new WP_Error( 'http_request_failed', 'Plugin lookup timed out.' );

		add_filter(
			'pre_http_request',
			static fn ( $preempt, $args, $url ) => $url === $lookup_url ? $error : $preempt,
			10,
			3
		);

		$this->assertSame( $error, Safeguard\search_plugin_info( $slug ) );
	}
}
