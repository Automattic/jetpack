<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate;


use Automattic\Jetpack_Boost\Lib\Nonce;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Provider;

class Generator {
	const GENERATE_QUERY_ACTION = 'jb-generate-critical-css';
	const GENERATE_PROXY_NONCE  = 'jb-generate-proxy-nonce';
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


	public function __construct( $providers ) {
		$this->state     = new Critical_CSS_State();
		$this->providers = $providers;
		if ( $this->state->is_empty() && ! wp_doing_ajax() && ! wp_doing_cron() ) {
			$this->state->create_request( $providers );
		}

		if ( is_admin() ) {
			add_action( 'wp_ajax_boost_proxy_css', array( $this, 'handle_css_proxy' ) );
		}

	}


	/**
	 * Get Critical CSS status.
	 */
	public function get_critical_css_status() {
		if ( $this->state->is_empty() ) {
			return [ 'status' => Critical_CSS_State::NOT_GENERATED ];
		}

		if ( $this->state->is_pending() ) {
			return [
				'status'                 => Critical_CSS_State::REQUESTING,
				'percent_complete'       => $this->state->get_percent_complete(),
				'success_count'          => $this->state->get_providers_success_count(),
				'pending_provider_keys'  => $this->state->get_provider_urls(),
				'provider_success_ratio' => $this->state->get_provider_success_ratios(),
			];
		}

		if ( $this->state->is_fatal_error() ) {
			return [
				'status'       => Critical_CSS_State::FAIL,
				'status_error' => $this->state->get_state_error(),
			];
		}

		$providers_errors    = $this->state->get_providers_errors();
		$provider_key_labels = array_combine(
			array_keys( $providers_errors ),
			array_map( [ $this, 'describe_provider_key' ], array_keys( $providers_errors ) )
		);

		return [
			'status'                => Critical_CSS_State::SUCCESS,
			'success_count'         => $this->state->get_providers_success_count(),
			'core_providers'        => self::CORE_PROVIDER_KEYS,
			'core_providers_status' => $this->state->get_core_providers_status( self::CORE_PROVIDER_KEYS ),
			'providers_errors'      => $providers_errors,
			'provider_key_labels'   => $provider_key_labels,
			'created'               => $this->state->get_created_time(),
		];
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
		foreach ( $this->providers as $provider ) {
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
		static $is_generating = NULL;
		if ( NULL !== $is_generating ) {
			return $is_generating;
		}

		// Accept nonce via HTTP headers or GET parameters.
		$generate_nonce = NULL;
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
	// phpcs:enable WordPress.Security.NonceVerification.Recommended



}