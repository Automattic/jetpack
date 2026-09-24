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

			$this->assertIsBool( $feature['delivery']['jetpack'] ?? null, "Feature {$slug} has no jetpack flag." );
			$this->assertIsString( $feature['delivery']['plugin'] ?? null, "Feature {$slug} has no plugin slug." );
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
	 * only be linked to. Every feature now carries one, Activity Log included.
	 */
	public function test_every_feature_has_a_product_or_a_module() {
		$unswitchable = array_keys(
			array_filter(
				Main_Features::get_feature_definitions(),
				fn( $feature ) => empty( $feature['product'] ) && empty( $feature['module'] )
			)
		);

		$this->assertSame( array(), $unswitchable, 'These features offer nothing to switch.' );
	}

	/**
	 * A module listed twice, or one a main feature already switches, would never show where it
	 * is listed. A plugin-delivered feature switches its plugin, so it covers no module.
	 */
	public function test_module_groups_list_each_module_once_and_skip_main_features() {
		// The Jetpack-delivered products whose module is named differently. That map lives in
		// the UI's `PRODUCT_MODULES`, which this package's PHP cannot read.
		$product_modules = array( 'publicize', 'contact-form', 'ai' );

		$definitions = array_filter(
			Main_Features::get_feature_definitions(),
			fn( $definition ) => ! empty( $definition['delivery']['jetpack'] )
		);
		$grouped     = array_merge( ...array_column( Main_Features::get_module_groups(), 'modules' ) );
		$covered     = array_filter(
			array_merge(
				$product_modules,
				array_column( $definitions, 'module' ),
				// A product whose module is named after it covers that slug too.
				array_column( $definitions, 'product' )
			)
		);

		$this->assertSame( array_unique( $grouped ), $grouped );
		$this->assertSame( array(), array_values( array_intersect( $grouped, $covered ) ) );
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
				'image'      => $feature['image'],
				'info_url'   => $feature['info_url'],
				'docs_url'   => $feature['docs_url'],
				'plugin_url' => $feature['delivery']['plugin_url'] ?? '',
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
				fn( $feature ) => $feature['delivery']['plugin_url'] ?? '',
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
				'stats'      => 'https://wordpress.org/plugins/jetpack-stats/',
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
				$feature['delivery']['plugin_url'] ?? '',
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
				empty( $feature['delivery']['plugin_name'] ),
				empty( $feature['delivery']['plugin_url'] ),
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

	/**
	 * The grid renders in the order it arrives, so sorting is the catalog's job.
	 */
	public function test_features_are_sorted_alphabetically_by_name() {
		$names = array_column( Main_Features::get_features(), 'name' );

		$sorted = $names;
		usort( $sorted, 'strnatcasecmp' );

		$this->assertSame( $sorted, $names );
	}

	/**
	 * The plugin name and link are what the modal offers to install, so a feature
	 * delivered by a plugin has to carry both, and one delivered only by Jetpack neither.
	 */
	public function test_plugin_backed_features_name_and_link_their_plugin() {
		$features = array_column( Main_Features::get_features(), null, 'slug' );

		$this->assertSame( 'Akismet Anti-spam', $features['anti-spam']['plugin_name'] );
		$this->assertSame( 'https://wordpress.org/plugins/akismet/', $features['anti-spam']['plugin_url'] );
		$this->assertSame( '', $features['activity-log']['plugin_name'] );
		$this->assertSame( '', $features['activity-log']['plugin_url'] );
	}

	/**
	 * The pills filter on plan membership, so every feature has to carry the key they read.
	 */
	public function test_every_feature_carries_the_keys_the_grid_reads() {
		foreach ( Main_Features::get_features() as $feature ) {
			foreach ( array( 'slug', 'name', 'description', 'icon', 'essential', 'plans', 'in_jetpack', 'plugin', 'plugin_status' ) as $key ) {
				$this->assertArrayHasKey( $key, $feature, "Feature {$feature['slug']} is missing {$key}" );
			}

			$this->assertIsArray( $feature['plans'] );
		}
	}

	/**
	 * The badges name the bundles a feature is sold in, so an empty list would quietly
	 * drop the only thing the modal says about buying it.
	 */
	public function test_plan_badges_name_the_bundles_that_include_a_feature() {
		$features = array_column( Main_Features::get_features(), 'plans', 'slug' );
		$backup   = array_column( $features['backup'], 'name', 'slug' );

		$this->assertArrayHasKey( 'security', $backup );
		$this->assertNotEmpty( $backup['security'] );
		$this->assertArrayHasKey( 'complete', $backup );
		// Blaze is not sold in a bundle, so it earns no badges.
		$this->assertSame( array(), $features['blaze'] );
	}

	/**
	 * My Jetpack runs from whichever plugin bundles it, and that is the one plugin a
	 * switch here must never turn off.
	 */
	public function test_the_hosting_plugin_is_read_from_the_package_path() {
		$this->assertSame(
			'jetpack-boost',
			Main_Features::plugin_slug_from_path(
				'/srv/wp-content/plugins',
				'/srv/wp-content/plugins/jetpack-boost/jetpack_vendor/automattic/jetpack-my-jetpack/src'
			)
		);

		$this->assertSame(
			'jetpack',
			Main_Features::plugin_slug_from_path(
				'/srv/wp-content/plugins/',
				'/srv/wp-content/plugins/jetpack/jetpack_vendor/automattic/jetpack-my-jetpack/src'
			)
		);

		// A package loaded from outside the plugin directory hosts nothing.
		$this->assertSame(
			'',
			Main_Features::plugin_slug_from_path( '/srv/wp-content/plugins', '/srv/monorepo/packages/my-jetpack/src' )
		);
	}

	/**
	 * A feature Jetpack does not switch must have a plugin to install instead.
	 */
	public function test_every_feature_can_be_switched_somewhere() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $definition ) {
			$this->assertTrue(
				$definition['delivery']['jetpack'] || '' !== $definition['delivery']['plugin'],
				"Feature {$slug} can be switched neither in Jetpack nor by a plugin"
			);
		}
	}

	/**
	 * A mapped plugin must be the product's own standalone plugin, or Install fetches the wrong one.
	 */
	public function test_plugins_match_the_product_standalone_plugin() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $definition ) {
			$product_class = isset( $definition['product'] ) ? Products::get_product_class( $definition['product'] ) : null;

			if ( ! $product_class ) {
				continue;
			}

			// Asserted both ways round: a product that ships a plugin must name it, and one
			// that does not must name nothing. Skipping the empty case would let a feature
			// lose its plugin — and with it the only control its card would offer.
			$expected = $product_class::$has_standalone_plugin ? $product_class::$plugin_slug : '';

			$this->assertSame(
				$expected,
				$definition['delivery']['plugin'],
				"Feature {$slug} names the wrong standalone plugin"
			);
		}
	}

	/**
	 * The REST route accepts exactly these, so the list is its allowlist.
	 */
	public function test_switchable_plugins_are_jetpack_and_the_mapped_plugins() {
		$plugins = Main_Features::get_switchable_plugins();

		$this->assertContains( 'jetpack', $plugins );
		$this->assertContains( 'blaze-ads', $plugins );
		$this->assertNotContains( '', $plugins );
		$this->assertSame( array_values( array_unique( $plugins ) ), $plugins );
	}

	/**
	 * A plugin that is not on disk reads as not installed rather than inactive.
	 */
	public function test_a_missing_plugin_reads_as_not_installed() {
		$this->assertSame( Main_Features::PLUGIN_NOT_INSTALLED, Main_Features::get_plugin_status( 'zero-bs-crm' ) );
	}

	/**
	 * A feature a host hid is left out, by its own slug or by its module's.
	 */
	public function test_features_a_host_hid_are_left_out() {
		$hide = function ( $states ) {
			$states['search']        = 'hidden';
			$states['subscriptions'] = 'hidden';
			return $states;
		};
		add_filter( 'jetpack_my_jetpack_feature_visibility', $hide );

		$slugs = array_column( Main_Features::get_features(), 'slug' );

		remove_filter( 'jetpack_my_jetpack_feature_visibility', $hide );

		$this->assertNotContains( 'search', $slugs );
		$this->assertNotContains( 'newsletter', $slugs );
		$this->assertContains( 'stats', $slugs );
	}
}
