<?php

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\Attributes\DataProvider;
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
			foreach ( array( 'name', 'description', 'long_description', 'icon', 'info_url', 'docs_url', 'delivery' ) as $key ) {
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
	 * is listed. A feature's module is its own, or else the one its product is named after.
	 */
	public function test_module_groups_list_each_module_once_and_skip_main_features() {
		// The modules a product owns under a different name. That map lives in the UI's
		// `PRODUCT_MODULES`, which this package's PHP cannot read.
		$product_modules = array( 'vaultpress', 'publicize', 'contact-form', 'ai' );

		$grouped = array_merge( ...array_column( Main_Features::get_module_groups(), 'modules' ) );
		$covered = array_merge(
			$product_modules,
			array_map(
				fn( $definition ) => empty( $definition['module'] ) ? ( $definition['product'] ?? '' ) : $definition['module'],
				Main_Features::get_feature_definitions()
			)
		);

		$this->assertSame( array_unique( $grouped ), $grouped );
		$this->assertSame( array(), array_values( array_intersect( $grouped, array_filter( $covered ) ) ) );
	}

	/**
	 * Brute Force Protection sits with Security, Shortlinks with Engagement, and Infinite Scroll in Other.
	 */
	public function test_module_groups_place_the_regrouped_modules() {
		$groups = array_column( Main_Features::get_module_groups(), 'modules', 'label' );

		$this->assertContains( 'protect', $groups['Security'] );
		$this->assertContains( 'shortlinks', $groups['Engagement'] );
		$this->assertNotContains( 'infinite-scroll', array_merge( ...array_values( $groups ) ) );
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

		$this->assertSame( array( 'boost', 'jetpack-forms', 'protect-dashboard', 'stats' ), $essential );
	}

	/**
	 * Every feature's artwork ships with the package, under the name its URL points at.
	 */
	public function test_every_feature_has_a_bundled_image() {
		foreach ( Main_Features::get_features() as $feature ) {
			$path = 'components/my-jetpack-tab-panel/features/images/' . $feature['slug'] . '.webp';

			$this->assertFileExists( dirname( __DIR__, 2 ) . '/_inc/' . $path, "Feature {$feature['slug']} has no image." );
			$this->assertStringEndsWith( $path, $feature['screenshot'] );
		}
	}

	/**
	 * The band palette lives in TypeScript and is keyed by slug, so only the catalog can
	 * say whether a key still matches a feature; a stale one falls back to a wrong color.
	 */
	public function test_every_feature_has_a_band_palette() {
		$source = file_get_contents( dirname( __DIR__, 2 ) . '/_inc/components/my-jetpack-tab-panel/features/band-palette.ts' );
		$body   = substr( $source, (int) strpos( $source, 'PALETTES' ) );

		preg_match_all( "/^\t'?([a-z0-9-]+)'?: \[/m", $body, $matches );

		$keys  = $matches[1];
		$slugs = array_keys( Main_Features::get_feature_definitions() );
		sort( $keys );
		sort( $slugs );

		$this->assertSame( $slugs, $keys );
	}

	/**
	 * These are rendered as links straight into the page, so a typo'd or
	 * non-https value would ship a broken card or a mixed-content warning.
	 */
	public function test_urls_are_absolute_https() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			$urls = array(
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
				'anti-spam'         => 'https://wordpress.org/plugins/akismet/',
				'backup'            => 'https://wordpress.org/plugins/jetpack-backup/',
				'blaze'             => 'https://wordpress.org/plugins/blaze-ads/',
				'boost'             => 'https://wordpress.org/plugins/jetpack-boost/',
				'crm'               => 'https://wordpress.org/plugins/zero-bs-crm/',
				'protect-dashboard' => 'https://wordpress.org/plugins/jetpack-protect/',
				'search'            => 'https://wordpress.org/plugins/jetpack-search/',
				'social'            => 'https://wordpress.org/plugins/jetpack-social/',
				'stats'             => 'https://wordpress.org/plugins/jetpack-stats/',
				'videopress'        => 'https://wordpress.org/plugins/jetpack-videopress/',
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
	 * A feature with a product page of its own must say what that page sells.
	 */
	public function test_features_with_an_interstitial_name_a_paid_product() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			if ( empty( $feature['interstitial'] ) ) {
				continue;
			}

			$this->assertNotEmpty(
				$feature['paid_product'] ?? '',
				"Feature {$slug} has an interstitial but no paid product."
			);
		}
	}

	/**
	 * The modal's free column must not appear for a feature that has no free tier, nor be missing for one that does.
	 */
	public function test_free_highlights_match_the_free_flag() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			$this->assertSame(
				$feature['delivery']['free'],
				! empty( $feature['free_highlights'] ),
				"Feature {$slug} disagrees with its free flag about having free highlights."
			);
		}
	}

	/**
	 * Only plans Jetpack sells today can be listed.
	 */
	public function test_plans_are_known_plans() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			foreach ( $feature['plans'] ?? array() as $plan ) {
				$this->assertContains(
					$plan,
					array( 'backup', 'security', 'complete', 'growth' ),
					"Feature {$slug} lists an unknown plan: {$plan}"
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

	/**
	 * A feature listing Jetpack Complete must offer a way to buy it.
	 */
	public function test_every_feature_in_complete_has_an_upgrade() {
		foreach ( Main_Features::get_features() as $feature ) {
			if ( ! in_array( 'complete', array_column( $feature['plans'], 'slug' ), true ) ) {
				continue;
			}

			$this->assertNotEmpty( $feature['upgrade']['path'], "Feature {$feature['slug']} lists Complete but has no upgrade." );
			$this->assertNotEmpty( $feature['upgrade']['name'], "Feature {$feature['slug']} does not name what its upgrade sells." );
		}
	}

	/**
	 * Fakes the site's purchases, so ownership is read without a request to WordPress.com.
	 *
	 * @param string[] $product_slugs The WordPress.com product slugs the site pays for.
	 */
	private function own( array $product_slugs ) {
		$purchases = array_map(
			fn( $slug ) => (object) array(
				'product_slug'  => $slug,
				'expiry_status' => 'active',
				'expiry_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+1 year' ) ),
			),
			$product_slugs
		);

		set_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY, $purchases, HOUR_IN_SECONDS );
		set_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, array( 'active' => array() ), HOUR_IN_SECONDS );
	}

	/**
	 * Clears the faked purchases.
	 */
	public function tearDown(): void {
		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
		delete_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY );
		parent::tearDown();
	}

	/**
	 * A site that owns Complete is offered no upgrade, including features with no product of their own.
	 */
	public function test_no_upgrade_for_a_site_that_owns_complete() {
		$this->own( array( 'jetpack_complete' ) );

		$upgrades = array_column( Main_Features::get_features(), 'upgrade', 'slug' );

		foreach ( array( 'activity-log', 'podcast', 'jetpack-forms', 'newsletter', 'anti-spam' ) as $slug ) {
			$this->assertSame( '', $upgrades[ $slug ]['path'], "Feature {$slug} still offers an upgrade to a Complete site." );
		}
	}

	/**
	 * Owning a smaller bundle covers only the features that bundle lists.
	 */
	public function test_no_upgrade_for_features_a_smaller_bundle_covers() {
		$this->own( array( 'jetpack_growth_yearly' ) );

		$upgrades = array_column( Main_Features::get_features(), 'upgrade', 'slug' );

		$this->assertSame( '', $upgrades['podcast']['path'] );
		$this->assertSame( '', $upgrades['newsletter']['path'] );
		$this->assertSame( '/add-backup', $upgrades['activity-log']['path'] );
	}

	/**
	 * Included in plan marks exactly the features the owned bundle covers.
	 */
	public function test_included_marks_what_the_owned_bundle_covers() {
		$this->own( array( 'jetpack_growth_yearly' ) );

		$included = array_column( Main_Features::get_features(), 'included', 'slug' );

		$this->assertTrue( $included['newsletter'] );
		$this->assertFalse( $included['activity-log'] );
		$this->assertFalse( $included['blaze'] );
	}

	/**
	 * Marked per plan, not per feature: a site on one bundle still has the others to buy,
	 * so only the plan it holds stops being a link to its own checkout.
	 */
	public function test_plan_badges_mark_only_the_plan_the_site_holds() {
		$this->own( array( 'jetpack_growth_yearly' ) );

		$plans = array_column( Main_Features::get_features(), 'plans', 'slug' );
		$owned = array_column( $plans['newsletter'], 'owned', 'slug' );

		$this->assertTrue( $owned['growth'] );
		$this->assertFalse( $owned['complete'] );
	}

	/**
	 * A site that already pays for a feature is not told to buy a plan before it can use it.
	 */
	public function test_setup_note_is_dropped_for_a_site_that_pays() {
		$notes = array_column( Main_Features::get_features(), 'setup_note', 'slug' );
		$this->assertNotSame( '', $notes['backup'] );
		$this->assertNotSame( '', $notes['search'] );

		$this->own( array( 'jetpack_complete' ) );

		$notes = array_column( Main_Features::get_features(), 'setup_note', 'slug' );
		$this->assertSame( '', $notes['backup'] );
		$this->assertSame( '', $notes['search'] );
	}

	/**
	 * A plan no bundle class lists still covers Activity Log when WordPress.com grants its paid history.
	 */
	public function test_no_activity_log_upgrade_for_a_site_with_full_activity_log() {
		$this->own( array( 'jetpack_personal' ) );
		set_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, array( 'active' => array( 'full-activity-log' ) ), HOUR_IN_SECONDS );

		$upgrades = array_column( Main_Features::get_features(), 'upgrade', 'slug' );

		$this->assertSame( '', $upgrades['activity-log']['path'] );
	}

	/**
	 * A free Search purchase shares its slug's prefix with the paid one, and must not count as paying.
	 */
	public function test_free_search_purchase_still_offers_the_upgrade() {
		$this->own( array( 'jetpack_search_free' ) );

		$upgrades = array_column( Main_Features::get_features(), 'upgrade', 'slug' );

		$this->assertSame( '/add-search', $upgrades['search']['path'] );
	}

	/**
	 * WordPress.com grants the free Search plan the same `search` site feature as the paid one.
	 */
	public function test_free_search_site_feature_still_offers_the_upgrade() {
		$this->own( array( 'jetpack_search_free' ) );
		set_transient( Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, array( 'active' => array( 'search' ) ), HOUR_IN_SECONDS );

		$upgrades = array_column( Main_Features::get_features(), 'upgrade', 'slug' );

		$this->assertSame( '/add-search', $upgrades['search']['path'] );
	}

	/**
	 * A paid Search purchase covers the feature, free plan or not.
	 */
	public function test_no_upgrade_for_a_site_that_pays_for_search() {
		$this->own( array( 'jetpack_search_free', 'jetpack_search' ) );

		$upgrades = array_column( Main_Features::get_features(), 'upgrade', 'slug' );

		$this->assertSame( '', $upgrades['search']['path'] );
	}

	/**
	 * Without a product page of its own, the upgrade sells the cheapest bundle that includes the feature.
	 */
	public function test_upgrade_falls_back_to_the_cheapest_bundle() {
		$upgrades = array_column( Main_Features::get_features(), 'upgrade', 'slug' );

		$this->assertSame( '/add-backup', $upgrades['activity-log']['path'] );
		$this->assertSame( 'Jetpack VaultPress Backup', $upgrades['activity-log']['name'] );
		$this->assertSame( '/add-growth', $upgrades['newsletter']['path'] );
		$this->assertSame( '/add-growth', $upgrades['podcast']['path'] );
		$this->assertSame( 'Jetpack Growth', $upgrades['podcast']['name'] );
		$this->assertSame( '/add-complete', $upgrades['jetpack-forms']['path'] );
		$this->assertSame( '/add-akismet', $upgrades['anti-spam']['path'] );
		$this->assertSame(
			array(
				'path' => '',
				'name' => '',
			),
			$upgrades['blaze']
		);
	}

	/**
	 * The upgrade sells the first bundle listed, so Complete, the priciest, must come last.
	 */
	public function test_plans_list_complete_last() {
		foreach ( Main_Features::get_feature_definitions() as $slug => $feature ) {
			$plans = $feature['plans'] ?? array();

			if ( in_array( 'complete', $plans, true ) ) {
				$this->assertSame( 'complete', end( $plans ), "Feature {$slug} lists a bundle after Complete." );
			}
		}
	}

	/**
	 * The modules on offer, and whether Protect should then ship in Jetpack.
	 *
	 * @return array[]
	 */
	public static function provide_protect_dashboard_offers() {
		return array(
			'module on offer'  => array( array( 'protect-dashboard' ), true ),
			'nothing on offer' => array( array(), false ),
		);
	}

	/**
	 * @dataProvider provide_protect_dashboard_offers
	 *
	 * @param string[] $modules  Modules on offer.
	 * @param bool     $expected Whether Protect ships in Jetpack.
	 */
	#[DataProvider( 'provide_protect_dashboard_offers' )]
	public function test_protect_ships_in_jetpack_only_while_its_module_is_on_offer( $modules, $expected ) {
		$offer = static function () use ( $modules ) {
			return $modules;
		};
		// Earlier tests may load the mock Jetpack plugin, which moves get_available() off the standalone filter.
		$jetpack_offer = static function () use ( $modules ) {
			return array_fill_keys( $modules, '1.0' );
		};
		// Definitions are memoized per locale, so a locale nothing else uses gets a fresh build.
		$locale = static function () use ( $expected ) {
			return $expected ? 'protect_dashboard_on_offer' : 'protect_dashboard_not_on_offer';
		};
		add_filter( 'jetpack_get_available_standalone_modules', $offer );
		add_filter( 'jetpack_get_available_modules', $jetpack_offer, PHP_INT_MAX );
		add_filter( 'locale', $locale );

		$delivery = Main_Features::get_feature_definitions()['protect-dashboard']['delivery']['jetpack'];

		remove_filter( 'jetpack_get_available_standalone_modules', $offer );
		remove_filter( 'jetpack_get_available_modules', $jetpack_offer, PHP_INT_MAX );
		remove_filter( 'locale', $locale );
		$this->assertSame( $expected, $delivery );
	}
}
