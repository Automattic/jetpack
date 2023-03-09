<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Lib\Nonce;

class Generator {

	const GENERATE_QUERY_ACTION = 'jb-generate-critical-css';
	const CSS_CALLBACK_ACTION   = 'jb-critical-css-callback';

	private $paths;

	public function __construct() {
		$this->paths = new Source_Providers();
	}

	/**
	 * Returns true if this pageload is generating Critical CSS, based on GET
	 * parameters and headers.
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public static function is_generating_critical_css() {
		static $is_generating = null;
		if ( null !== $is_generating ) {
			return $is_generating;
		}

		// Accept nonce via HTTP headers or GET parameters.
		$generate_nonce = null;
		if ( ! empty( $_GET[ self::GENERATE_QUERY_ACTION ] ) ) {
			$generate_nonce = sanitize_key(
				$_GET[ self::GENERATE_QUERY_ACTION ]
			);
		} elseif ( ! empty( $_SERVER['HTTP_X_GENERATE_CRITICAL_CSS'] ) ) {
			$generate_nonce = sanitize_key(
				$_SERVER['HTTP_X_GENERATE_CRITICAL_CSS']
			);
		}

		// If GET parameter or header set, we are trying to generate.
		$is_generating = ! empty( $generate_nonce );

		// Die if the nonce is invalid.
		if ( $is_generating && ! Nonce::verify( $generate_nonce, self::GENERATE_QUERY_ACTION ) ) {
			die();
		}

		return $is_generating;
	}

	/**
	 * Get a Critical CSS status block, adding in local generation nonces (if applicable).
	 * i.e.: Call this method to supply enough Critical CSS status to kick off local generation,
	 * such as in response to a request-generate API call or during page initialization.
	 */
	public function get_generation_metadata() {
		$status = array();

		// Add viewport sizes.
		$status['viewports'] = array(
			0 => array(
				'type'   => 'phone',
				'width'  => 414,
				'height' => 896,
			),
			1 => array(
				'type'   => 'tablet',
				'width'  => 1200,
				'height' => 800,
			),
			2 => array(
				'type'   => 'desktop',
				'width'  => 1920,
				'height' => 1080,
			),
		);

		// Add a userless nonce to use when requesting pages for Critical CSS generation (i.e.: To turn off admin features).
		$status['generation_nonce'] = Nonce::create( self::GENERATE_QUERY_ACTION );

		// Add a user-bound nonce to use when proxying CSS for Critical CSS generation.
		$status['proxy_nonce'] = wp_create_nonce( CSS_Proxy::NONCE_ACTION );

		// Add a passthrough block to include in all response callbacks.
		$status['callback_passthrough'] = array(
			'_nonce' => Nonce::create( self::CSS_CALLBACK_ACTION ),
		);

		return $status;
	}

}
