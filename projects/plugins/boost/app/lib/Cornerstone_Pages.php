<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Data_Sync\Cornerstone_Pages_Entry;

class Cornerstone_Pages implements Has_Setup {

	const PREMIUM_MAX_PAGES = 10;
	const FREE_MAX_PAGES    = 1;

	public function setup() {
		add_filter( 'jetpack_boost_critical_css_providers', array( $this, 'remove_ccss_front_page_provider' ), 10, 2 );
		add_filter( 'display_post_states', array( $this, 'add_display_post_states' ), 10, 2 );
		add_action( 'init', array( $this, 'register_ds_stores' ) );
	}

	public function register_ds_stores() {
		$schema = Schema::as_array( Schema::as_string() )->fallback( $this->default_pages() );
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
		if ( $this->get_max_pages() === static::FREE_MAX_PAGES ) {
			return array( '' );
		}

		$max_pages               = $this->get_max_pages();
		$yoast_cornerstone_pages = $this->get_yoast_cornerstone_pages();
		$woocommerce_pages       = $this->get_woocommerce_pages();

		$homepage = array( '' );

		$urls = array_unique( array_merge( $homepage, $woocommerce_pages, $yoast_cornerstone_pages ) );

		return array_slice( $urls, 0, $max_pages );
	}

	private function get_yoast_cornerstone_pages() {
		$max_pages                 = $this->get_max_pages();
		$yoast_cornerstone_content = get_posts(
			array(
				'meta_key'       => '_yoast_wpseo_is_cornerstone',
				'meta_value'     => '1',
				'post_type'      => 'any',
				'posts_per_page' => $max_pages,
			)
		);

		$urls = array();
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

	public function get_pages() {
		$pages = jetpack_boost_ds_get( 'cornerstone_pages_list' );

		$permalink_structure = get_option( 'permalink_structure' );

		// If permalink structure ends with slash, add trailing slashes
		if ( $permalink_structure && substr( $permalink_structure, -1 ) === '/' ) {
			$pages = array_map( 'trailingslashit', $pages );
		}

		return $pages;
	}

	public function get_properties() {
		return array(
			'max_pages' => $this->get_max_pages(),
		);
	}

	public function add_display_post_states( $post_states, $post ) {
		$cornerstone_pages = $this->get_pages();
		if ( ! empty( $cornerstone_pages ) ) {
			$post_url          = untrailingslashit( get_permalink( $post ) );
			$cornerstone_pages = array_map( 'untrailingslashit', $cornerstone_pages );

			if ( in_array( $post_url, $cornerstone_pages, true ) ) {
				$post_states[] = __( 'Cornerstone Page', 'jetpack-boost' );
			}
		}

		return $post_states;
	}

	private function get_max_pages() {
		return Premium_Features::has_any() ? static::PREMIUM_MAX_PAGES : static::FREE_MAX_PAGES;
	}
}
