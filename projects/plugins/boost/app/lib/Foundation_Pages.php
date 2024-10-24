<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;

class Foundation_Pages implements Has_Setup {

	public function setup() {
		if ( ! $this->is_development_features_enabled() ) {
			return;
		}

		add_filter( 'jetpack_boost_critical_css_providers', array( $this, 'remove_ccss_front_page_provider' ), 10, 2 );
		add_filter( 'display_post_states', array( $this, 'add_display_post_states' ), 10, 2 );
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
		return Premium_Features::has_any() ? 10 : 1;
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
