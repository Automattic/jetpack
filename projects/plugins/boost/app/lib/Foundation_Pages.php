<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Data_Sync\Foundation_Pages_Entry;

class Foundation_Pages implements Has_Setup {

	const PREMIUM_MAX_PAGES = 10;
	const FREE_MAX_PAGES    = 1;

	public function setup() {
		if ( ! $this->is_development_features_enabled() ) {
			return;
		}

		add_filter( 'jetpack_boost_critical_css_providers', array( $this, 'remove_ccss_front_page_provider' ), 10, 2 );
		add_filter( 'display_post_states', array( $this, 'add_display_post_states' ), 10, 2 );
		add_action( 'init', array( $this, 'register_ds_stores' ) );
	}

	public function register_ds_stores() {
		$schema = Schema::as_array( Schema::as_string() )->fallback( self::default_pages() );
		jetpack_boost_register_option( 'foundation_pages_list', $schema, new Foundation_Pages_Entry( 'foundation_pages_list' ) );
		jetpack_boost_register_readonly_option( 'foundation_pages_properties', array( $this, 'get_properties' ) );
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
			return array( '/' );
		}

		$max_pages               = $this->get_max_pages();
		$yoast_cornerstone_pages = $this->get_yoast_cornerstone_pages();
		$woocommerce_pages       = $this->get_woocommerce_pages();

		$homepage = array( '/' );

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
			$permalink = $this->make_relative_url( $permalink );
			$urls[]    = $permalink;
		}

		return $urls;
	}

	private function get_woocommerce_pages() {
		$urls = array();
		if ( ! function_exists( 'wc_get_page_id' ) ) {
			return $urls;
		}

		$shop_page_id = wc_get_page_id( 'shop' );
		if ( $shop_page_id ) {
			$url = get_permalink( $shop_page_id );
			$url = $this->make_relative_url( $url );

			if ( $url ) {
				$urls[] = $url;
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
		if ( ! $this->is_development_features_enabled() ) {
			return array();
		}

		return jetpack_boost_ds_get( 'foundation_pages_list' );
	}

	public function get_properties() {
		return array(
			'max_pages' => $this->get_max_pages(),
			'blog_url'  => $this->get_blog_url(),
		);
	}

	public function add_display_post_states( $post_states, $post ) {
		$foundation_pages = $this->get_pages();
		if ( ! empty( $foundation_pages ) ) {
			$post_url         = untrailingslashit( get_permalink( $post ) );
			$foundation_pages = array_map( 'untrailingslashit', $foundation_pages );

			if ( in_array( $post_url, $foundation_pages, true ) ) {
				$post_states[] = __( 'Foundation Page', 'jetpack-boost' );
			}
		}

		return $post_states;
	}

	private function get_max_pages() {
		return Premium_Features::has_any() ? static::PREMIUM_MAX_PAGES : static::FREE_MAX_PAGES;
	}

	private function get_blog_url() {
		$front_page = (int) get_option( 'page_on_front' );
		$posts_page = (int) get_option( 'page_for_posts' );
		if ( $posts_page ) {
			$permalink = get_permalink( $posts_page );
			if ( ! empty( $permalink ) ) {
				return $permalink;
			}
		} elseif ( ! $front_page ) {
			return home_url( '/' );
		}

		return null;
	}

	private function is_development_features_enabled() {
		return defined( 'JETPACK_BOOST_DEVELOPMENT_FEATURES' ) && JETPACK_BOOST_DEVELOPMENT_FEATURES;
	}
}
