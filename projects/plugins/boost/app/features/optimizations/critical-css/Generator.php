<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Provider;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Lib\Nonce;

class Generator {

	const GENERATE_QUERY_ACTION = 'jb-generate-critical-css';
	const CSS_CALLBACK_ACTION   = 'jb-critical-css-callback';

	/**
	 * Provider keys which are present in "core" WordPress. If any of these fail to generate,
	 * the whole process should be considered broken.
	 */
	const CORE_PROVIDER_KEYS = array(
		'core_front_page',
		'core_posts_page',
		'singular_page',
		'singular_post',
		'singular_product',
	);

	public $state;

	public function __construct( $state = 'local' ) {
		$this->state = new Critical_CSS_State( $state );
		$this->paths = new Source_Providers();
	}

	/**
	 * Given a provider key, find the provider which owns the key. Returns false
	 * if no Provider is found.
	 *
	 * @param string $provider_key Provider key.
	 *
	 * @return Provider|false|string
	 */
	public function find_provider_for( $provider_key ) {
		foreach ( $this->paths->get_providers() as $provider ) {
			if ( $provider::owns_key( $provider_key ) ) {
				return $provider;
			}
		}

		return false;
	}

	/**
	 * Returns a descriptive label for a provider key, or the raw provider key
	 * if none found.
	 *
	 * @param string $provider_key Provider key.
	 *
	 * @return mixed
	 */
	public function describe_provider_key( $provider_key ) {
		$provider = $this->find_provider_for( $provider_key );
		if ( ! $provider ) {
			return $provider_key;
		}

		/**
		 * Provider key.
		 *
		 * @param string $provider_key
		 */
		return $provider::describe_key( $provider_key );
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
	public function get_local_critical_css_generation_info() {

		// @REFACTORING:
		// This method should be moved inside critical_css_state DataSync handling class
		// to pre-populate the data on request and strip it out when receiving the data
		// so that it's not persisted in the db.

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

		$status['sources'] = $this->paths->get_sources();

		return $status;
	}

}
