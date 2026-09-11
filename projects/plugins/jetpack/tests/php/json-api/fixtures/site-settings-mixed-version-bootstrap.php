<?php
// phpcs:ignoreFile -- This standalone fixture must stub the partially loaded runtime.
/**
 * Loads the site settings endpoint with legacy verification helpers present.
 *
 * @package automattic/jetpack
 */

define( 'ABSPATH', __DIR__ );

/**
 * Minimal endpoint stub.
 */
class WPCOM_JSON_API_Endpoint {
	/**
	 * Accept endpoint registration arguments.
	 *
	 * @param array $args Endpoint arguments.
	 */
	public function __construct( $args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}
}

/**
 * Minimal SEO utility stub.
 */
class Jetpack_SEO_Utils {
	const FRONT_PAGE_META_OPTION = 'advanced_seo_front_page_description';
}

/**
 * Minimal SEO titles stub.
 */
class Jetpack_SEO_Titles {
	const TITLE_FORMATS_OPTION = 'jetpack_seo_titles';
}

/**
 * Simulate the legacy helper loaded from the active deployment tree.
 *
 * @param array $codes Verification codes.
 * @return array
 */
function jetpack_verification_validate( $codes ) {
	return $codes;
}

/**
 * Simulate the legacy tag parser loaded from the active deployment tree.
 *
 * @param string $code Verification code.
 * @return string
 */
function jetpack_verification_get_code( $code ) {
	return $code;
}

$plugin_dir = dirname( __DIR__, 4 );
require $plugin_dir . '/json-endpoints/class.wpcom-json-api-site-settings-endpoint.php';

if ( ! function_exists( 'jetpack_verification_validate_code' ) ) {
	throw new RuntimeException( 'The site settings endpoint did not load its verification helper.' );
}

if ( 'verification-code' !== jetpack_verification_validate_code( 'verification-code' ) ) {
	throw new RuntimeException( 'The site verification helper did not validate a code.' );
}

echo "OK\n";
