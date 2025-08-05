<?php

namespace Automattic\Jetpack_Boost\Lib\Cornerstone;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Data_Sync\Cornerstone_Pages_Entry;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
class Cornerstone_Pages implements Has_Setup {

	const PREMIUM_MAX_PAGES = 10;
	const FREE_MAX_PAGES    = 1;

	public function setup() {
		$this->register_ds_stores();

		add_filter( 'jetpack_boost_critical_css_providers', array( $this, 'remove_ccss_front_page_provider' ), 10, 2 );
		add_filter( 'display_post_states', array( $this, 'add_display_post_states' ), 10, 2 );
		add_action( 'init', array( $this, 'set_default_pages' ), 0 );
	}

	/**
	 * Set the default pages for the first time Boost is running on the website.
	 */
	public function set_default_pages() {
		// Since the DS store always returns an empty array, we can't know if the user
		// wants an empty list of pages or this is the first time Boost is running on the website
		// and we need to actually load the default pages.
		$raw_pages = \get_option( 'jetpack_boost_ds_cornerstone_pages_list' );
		if ( $raw_pages === false ) {
			jetpack_boost_ds_set( 'cornerstone_pages_list', $this->default_pages() );
		}
	}

	private function register_ds_stores() {
		$schema = Schema::as_array( Schema::as_string() )->fallback( array() );
		jetpack_boost_register_option( 'cornerstone_pages_list', $schema, new Cornerstone_Pages_Entry( 'cornerstone_pages_list' ) );
		jetpack_boost_register_readonly_option( 'cornerstone_pages_properties', array( $this, 'get_properties' ) );
	}

	public function remove_ccss_front_page_provider( $providers ) {
		$filtered_providers = array();

		foreach ( $providers as $provider ) {
			if ( $provider['key'] !== 'core_front_page' ) {
				$filtered_providers[] = $provider;
			}
		}

		return $filtered_providers;
	}

	private function default_pages() {
		$max_pages               = $this->get_max_pages();
		$yoast_cornerstone_pages = $this->get_yoast_cornerstone_pages();
		$woocommerce_pages       = $this->get_woocommerce_pages();

		$urls = array_unique( array_merge( $woocommerce_pages, $yoast_cornerstone_pages ) );
		$urls = array_map( 'untrailingslashit', $urls );

		// An empty string represents the home page.
		// Remove it if it's in the list since the home page is a predefined page.
		$urls = array_filter( $urls );

		return array_slice( $urls, 0, $max_pages );
	}

	private function get_yoast_cornerstone_pages() {
		$urls = array();
		if ( ! function_exists( 'wpseo_init' ) ) {
			return $urls;
		}

		$max_pages                 = $this->get_max_pages();
		$yoast_cornerstone_content = get_posts(
			array(
				'meta_key'       => '_yoast_wpseo_is_cornerstone',
				'meta_value'     => '1',
				'post_type'      => 'any',
				'posts_per_page' => $max_pages,
			)
		);

		foreach ( $yoast_cornerstone_content as $post ) {
			$permalink = get_permalink( $post->ID );
			if ( $permalink ) {
				$relative_permalink = $this->make_relative_url( $permalink );
				$urls[]             = $relative_permalink;
			}
		}
		return $urls;
	}

	private function get_woocommerce_pages() {
		$urls = array();
		if ( ! function_exists( 'wc_get_page_id' ) ) {
			return $urls;
		}

		$shop_page_id = \wc_get_page_id( 'shop' );
		if ( $shop_page_id ) {
			$url = get_permalink( $shop_page_id );
			if ( $url ) {
				$relative_url = $this->make_relative_url( $url );

				if ( $relative_url ) {
					$urls[] = $relative_url;
				}
			}
		}

		return $urls;
	}

	private function make_relative_url( $url ) {
		if ( is_string( $url ) && strpos( $url, home_url() ) === 0 ) {
			$url = substr( $url, strlen( home_url() ) );
		}

		return $url;
	}

	public function get_properties() {
		$properties = array(
			'max_pages'         => $this->get_max_pages(),
			'max_pages_premium' => static::PREMIUM_MAX_PAGES,
			'default_pages'     => array(),
			'predefined_pages'  => Cornerstone_Utils::get_predefined_list(),
		);

		// We need this to ensure we don't include the home page in the default pages since an empty array is returned when no default pages are found.
		$default_pages = $this->default_pages();

		if ( ! empty( $default_pages ) ) {
			$properties['default_pages'] = array_map( 'home_url', $default_pages );
		}
		return $properties;
	}

	public function add_display_post_states( $post_states, $post ) {
		if ( Cornerstone_Utils::is_cornerstone_page( $post->ID ) ) {
			$post_states[] = __( 'Cornerstone Page', 'jetpack-boost' );
		}

		return $post_states;
	}

	private function get_max_pages() {
		return Premium_Features::has_feature( Premium_Features::CORNERSTONE_TEN_PAGES ) ? static::PREMIUM_MAX_PAGES : static::FREE_MAX_PAGES;
	}
}
