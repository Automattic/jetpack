<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Archive_Provider;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Cornerstone_Provider;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Post_ID_Provider;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Provider;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Singular_Post_Provider;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Taxonomy_Provider;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\WP_Core_Provider;

class Source_Providers {

	/**
	 * Variable used to cache the CSS string during the page request.
	 * This is here because `get_critical_css` is called multiple
	 * times in `style_loader_tag` hook (on each CSS file).
	 *
	 * @var null|false|string
	 */
	protected $request_cached_css;

	/**
	 * Stores the Critical CSS key used for rendering the current page if any.
	 *
	 * @var null|string
	 */
	protected $current_critical_css_key;

	/**
	 * List of all the Critical CSS Types.
	 *
	 * The order is important because searching for critical CSS will stop as soon as a value is found.
	 * So finding Critical CSS by post ID is attempted before searching for a common Singular Post critical CSS.
	 *
	 * @var Provider[]
	 */
	protected $providers = array(
		Cornerstone_Provider::class,
		Post_ID_Provider::class,
		WP_Core_Provider::class,
		Singular_Post_Provider::class,
		Archive_Provider::class,
		Taxonomy_Provider::class,
	);

	public function get_providers() {
		return $this->providers;
	}

	/**
	 * Returns the Provider which controls a given key.
	 */
	public function get_provider_for_key( $key ) {
		foreach ( $this->providers as $provider ) {
			if ( $provider::owns_key( $key ) ) {
				return $provider;
			}
		}

		return null;
	}

	/**
	 * Get all critical CSS storage keys that are available for the current request.
	 * Caches the result.
	 *
	 * @return array
	 */
	public function get_current_request_css_keys() {
		static $keys = null;
		if ( null !== $keys ) {
			return $keys;
		}

		$keys = array();

		foreach ( $this->providers as $provider ) {
			$provider_keys = $provider::get_current_storage_keys();
			if ( empty( $provider_keys ) ) {
				continue;
			}
			$keys = array_merge( $keys, $provider_keys );
		}

		return $keys;
	}

	/**
	 * Get critical CSS for the current request.
	 *
	 * @return string|false
	 */
	public function get_current_request_css() {
		if ( null !== $this->request_cached_css ) {
			return $this->request_cached_css;
		}

		$storage = new Critical_CSS_Storage();
		$data    = $storage->get_css( $this->get_current_request_css_keys() );
		if ( false === $data ) {
			return false;
		}

		$this->request_cached_css       = $data['css'];
		$this->current_critical_css_key = $data['key'];

		return $this->request_cached_css;
	}

	public function get_current_critical_css_key() {
		return $this->current_critical_css_key;
	}

	/**
	 * Get providers sources.
	 *
	 * @return array
	 */
	public function get_provider_sources( $context_posts = array() ) {
		$sources                        = array();
		$flat_core_and_cornerstone_urls = array();

		$wp_core_provider_urls = WP_Core_Provider::get_critical_source_urls( $context_posts );
		foreach ( $wp_core_provider_urls as $urls ) {
			$flat_core_and_cornerstone_urls = array_merge( $flat_core_and_cornerstone_urls, $urls );
		}
		$cornerstone_provider_urls = Cornerstone_Provider::get_critical_source_urls( $context_posts );
		foreach ( $cornerstone_provider_urls as $urls ) {
			$flat_core_and_cornerstone_urls = array_merge( $flat_core_and_cornerstone_urls, $urls );
		}
		$flat_core_and_cornerstone_urls = array_values( array_unique( $flat_core_and_cornerstone_urls ) );

		foreach ( $this->get_providers() as $provider ) {
			$provider_name = $provider::get_provider_name();

			// For each provider,
			// Gather a list of URLs that are going to be used as Critical CSS source.
			foreach ( $provider::get_critical_source_urls( $context_posts ) as $group => $urls ) {
				if ( empty( $urls ) ) {
					continue;
				}

				// This removes core and cornerstone URLs from the list of URLs,
				// so they don't belong to two separate groups.
				if ( ! in_array( $provider, array( WP_Core_Provider::class, Cornerstone_Provider::class ), true ) ) {
					$urls = array_values( array_diff( $urls, $flat_core_and_cornerstone_urls ) );
				}

				if ( empty( $urls ) ) {
					continue;
				}

				$urls = $this->make_absolute_urls( $urls );

				$key = $provider_name . '_' . $group;

				// For each provider
				// Track the state and errors in a state array.
				$sources[] = array(
					'key'           => $key,
					'label'         => $provider::describe_key( $key ),
					/**
					 * Filters the URLs used by Critical CSS for each provider.
					 *
					 * @param array $urls The list of URLs to be used to generate critical CSS
					 * @param string $provider The provider name.
					 * @since   1.0.0
					 */
					'urls'          => apply_filters( 'jetpack_boost_critical_css_urls', $urls, $provider ),
					'success_ratio' => $provider::get_success_ratio(),
				);
			}
		}

		/**
		 * Filters the list of Critical CSS source providers.
		 *
		 * @param array $sources The list of Critical CSS source providers.
		 * @since 3.6.0
		 */
		return apply_filters( 'jetpack_boost_critical_css_providers', $sources );
	}

	/**
	 * Make URLs absolute.
	 *
	 * @param array $urls The list of URLs to make absolute.
	 *
	 * @return array
	 */
	private function make_absolute_urls( $urls ) {
		$absolute_urls = array();
		foreach ( $urls as $url ) {
			if ( class_exists( '\WP_Http' ) && method_exists( '\WP_Http', 'make_absolute_url' ) ) {
				$absolute_urls[] = \WP_Http::make_absolute_url( $url, home_url() );
				continue;
			}

			if ( stripos( $url, home_url() ) === 0 ) {
				$absolute_urls[] = $url;
			} else {
				$absolute_urls[] = home_url( $url );
			}
		}

		return $absolute_urls;
	}
}
