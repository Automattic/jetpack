<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Archive_Provider;
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

	/**
	 * Get providers sources.
	 *
	 * @param array $providers Providers.
	 *
	 * @return array
	 */
	public function get_provider_sources() {
		$sources = array();

		foreach ( $this->get_providers() as $provider ) {
			$provider_name = $provider::get_provider_name();

			// For each provider,
			// Gather a list of URLs that are going to be used as Critical CSS source.
			foreach ( $provider::get_critical_source_urls() as $group => $urls ) {
				$key = $provider_name . '_' . $group;

				// For each URL
				// Track the state and errors in a state array.
				$sources[] = array(
					'key'           => $key,
					'label'         => $provider::describe_key( $key ),
					'urls'          => apply_filters( 'jetpack_boost_critical_css_urls', $urls ),
					'success_ratio' => $provider::get_success_ratio(),
				);
			}
		}

		return $sources;
	}

}
