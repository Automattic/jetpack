<?php
// phpcs:ignoreFile -- This standalone fixture must stub the partially loaded runtime.
/**
 * Loads the site settings endpoint with WordPress.com verification helpers present.
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
 * Simulate the legacy validation helper loaded by WordPress.com.
 *
 * @param array $codes Verification codes.
 * @return array
 */
function jetpack_verification_validate( $codes ) {
	return $codes;
}

/**
 * Simulate the legacy WordPress.com parser, where urldecode changes plus signs.
 *
 * @param string $code Verification meta tag.
 * @return string|false
 */
function jetpack_verification_get_code( $code ) {
	$pattern = '/content=["\']?([^"\' ]*)["\' ]/is';
	preg_match( $pattern, $code, $match );

	return $match ? urldecode( $match[1] ) : false;
}

/**
 * Minimal action stub.
 */
function do_action() {
}

$plugin_dir = dirname( __DIR__, 4 );
require $plugin_dir . '/json-endpoints/class.wpcom-json-api-site-settings-endpoint.php';

$code     = '+nxGUDJ4QpAZ5l9Bsjdi102tLVC21AIh5d1Nl23908vVuFHs34=';
$meta_tag = '<meta name="google-site-verification" content="' . $code . '" />';

if ( ! function_exists( 'jetpack_verification_validate_codes' ) ) {
	throw new RuntimeException( 'The site settings endpoint did not load its verification helpers.' );
}

if ( $code !== jetpack_verification_validate_code( $meta_tag ) ) {
	throw new RuntimeException( 'The site verification helper did not preserve the plus sign.' );
}

if ( array( 'google' => $code ) !== jetpack_verification_validate_codes( array( 'google' => $meta_tag ) ) ) {
	throw new RuntimeException( 'The site verification collection was not normalized canonically.' );
}

echo "OK\n";
