<?php

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the main features catalog.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Main_Features
 */
class Main_Features_Test extends TestCase {

	/**
	 * Every entry carries the fields a feature card needs.
	 */
	public function test_every_feature_carries_the_required_fields() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			foreach ( array( 'name', 'description', 'long_description', 'icon', 'image', 'info_url', 'docs_url', 'delivery' ) as $key ) {
				$this->assertNotEmpty( $feature[ $key ] ?? null, "Feature {$slug} has no {$key}." );
			}

			$this->assertIsBool( $feature['delivery']['in_jetpack'] ?? null, "Feature {$slug} has no in_jetpack flag." );
			$this->assertIsBool( $feature['delivery']['free'] ?? null, "Feature {$slug} has no free flag." );
		}
	}

	/**
	 * A product key must name a product the My Jetpack registry knows.
	 */
	public function test_product_keys_resolve_to_real_products() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			if ( empty( $feature['product'] ) ) {
				continue;
			}

			$this->assertNotNull(
				Products::get_product_class( $feature['product'] ),
				"Feature {$slug} names an unknown product: {$feature['product']}"
			);
		}
	}

	/**
	 * A feature switched by neither a product nor a module has nothing to toggle and can
	 * only be linked to. Only Activity Log is allowed in that state.
	 */
	public function test_only_activity_log_has_no_product_or_module() {
		$unswitchable = array_keys(
			array_filter(
				Main_Features::get_feature_definitions(),
				fn( $feature ) => empty( $feature['product'] ) && empty( $feature['module'] )
			)
		);

		$this->assertSame( array( 'activity-log' ), $unswitchable );
	}

	/**
	 * The essential set is what a site is nudged towards, so it is asserted explicitly
	 * rather than left to whoever edits the catalog next.
	 */
	public function test_essential_features_are_the_expected_four() {
		$essential = array_keys(
			array_filter( Main_Features::get_feature_definitions(), fn( $feature ) => ! empty( $feature['essential'] ) )
		);
		sort( $essential );

		$this->assertSame( array( 'boost', 'jetpack-forms', 'protect', 'stats' ), $essential );
	}

	/**
	 * These are rendered as links and images straight into the page, so a typo'd or
	 * non-https value would ship a broken card or a mixed-content warning.
	 */
	public function test_urls_are_absolute_https() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			$urls = array(
				'image'          => $feature['image'],
				'info_url'       => $feature['info_url'],
				'docs_url'       => $feature['docs_url'],
				'standalone_url' => $feature['delivery']['standalone_url'] ?? '',
			);

			foreach ( array_filter( $urls ) as $key => $url ) {
				$this->assertNotFalse(
					filter_var( $url, FILTER_VALIDATE_URL ),
					"Feature {$slug} has an invalid {$key}: {$url}"
				);
				$this->assertSame(
					'https',
					wp_parse_url( $url, PHP_URL_SCHEME ),
					"Feature {$slug} has a non-https {$key}: {$url}"
				);
			}
		}
	}

	/**
	 * Pinned so a product gaining or losing its own plugin has to be a deliberate change.
	 */
	public function test_standalone_plugins_are_the_expected_set() {
		$urls = array_filter(
			array_map(
				fn( $feature ) => $feature['delivery']['standalone_url'] ?? '',
				Main_Features::get_feature_definitions()
			)
		);
		ksort( $urls );

		$this->assertSame(
			array(
				'anti-spam'  => 'https://wordpress.org/plugins/akismet/',
				'backup'     => 'https://wordpress.org/plugins/jetpack-backup/',
				'blaze'      => 'https://wordpress.org/plugins/blaze-ads/',
				'boost'      => 'https://wordpress.org/plugins/jetpack-boost/',
				'crm'        => 'https://wordpress.org/plugins/zero-bs-crm/',
				'protect'    => 'https://wordpress.org/plugins/jetpack-protect/',
				'search'     => 'https://wordpress.org/plugins/jetpack-search/',
				'social'     => 'https://wordpress.org/plugins/jetpack-social/',
				'videopress' => 'https://wordpress.org/plugins/jetpack-videopress/',
			),
			$urls
		);
	}

	/**
	 * A product that declares its own plugin must link to that plugin, and a product that
	 * only ships in Jetpack must not claim a standalone one.
	 */
	public function test_standalone_urls_match_the_product_plugin_slug() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			if ( empty( $feature['product'] ) ) {
				continue;
			}

			$product_class = Products::get_product_class( $feature['product'] );
			$plugin_slug   = $product_class::$plugin_slug;
			$expected      = ( $plugin_slug && Product::JETPACK_PLUGIN_SLUG !== $plugin_slug )
				? "https://wordpress.org/plugins/{$plugin_slug}/"
				: '';

			$this->assertSame(
				$expected,
				$feature['delivery']['standalone_url'] ?? '',
				"Feature {$slug} links to the wrong standalone plugin."
			);
		}
	}

	/**
	 * A standalone plugin needs both a name to show and a page to link to.
	 */
	public function test_standalone_name_and_url_come_together() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			$this->assertSame(
				empty( $feature['delivery']['standalone'] ),
				empty( $feature['delivery']['standalone_url'] ),
				"Feature {$slug} has a standalone plugin name or URL without the other."
			);
		}
	}

	/**
	 * A feature without a product needs an admin page to link to.
	 */
	public function test_features_without_a_product_have_an_admin_page() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			if ( empty( $feature['product'] ) ) {
				$this->assertNotEmpty( $feature['admin_page'] ?? '', "Feature {$slug} has neither a product nor an admin page." );
			}
		}
	}

	/**
	 * The free flag of a product-backed feature must agree with the product's own free offering.
	 */
	public function test_free_flag_matches_the_product_free_offering() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			if ( empty( $feature['product'] ) ) {
				continue;
			}

			$product_class = Products::get_product_class( $feature['product'] );

			$this->assertSame(
				(bool) $product_class::$has_free_offering,
				$feature['delivery']['free'],
				"Feature {$slug} disagrees with its product about having a free offering."
			);
		}
	}

	/**
	 * Pinned so a feature losing or gaining a free tier has to be a deliberate change.
	 */
	public function test_only_backup_and_blaze_cannot_be_used_without_paying() {
		$paid_only = array_keys(
			array_filter( Main_Features::get_feature_definitions(), fn( $feature ) => ! $feature['delivery']['free'] )
		);
		sort( $paid_only );

		$this->assertSame( array( 'backup', 'blaze' ), $paid_only );
	}

	/**
	 * A feature that can be upgraded must say what to buy.
	 */
	public function test_features_with_paid_highlights_name_a_paid_product() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			if ( empty( $feature['paid_highlights'] ) ) {
				continue;
			}

			$this->assertNotEmpty(
				$feature['paid_product'] ?? '',
				"Feature {$slug} lists paid highlights but no paid product."
			);
		}
	}

	/**
	 * Only bundles Jetpack sells today can be listed.
	 */
	public function test_plans_are_known_bundles() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			foreach ( $feature['plans'] ?? array() as $plan ) {
				$this->assertContains(
					$plan,
					array( 'security', 'complete', 'growth' ),
					"Feature {$slug} lists an unknown bundle: {$plan}"
				);
			}
		}
	}
}
