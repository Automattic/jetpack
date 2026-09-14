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
	 * Every feature is delivered with the full contract the Features tab reads.
	 */
	public function test_every_feature_carries_the_full_shape() {
		foreach ( Main_Features::get_features() as $feature ) {
			$this->assertArrayHasKey( 'slug', $feature );
			$this->assertArrayHasKey( 'name', $feature );
			$this->assertArrayHasKey( 'description', $feature );
			$this->assertArrayHasKey( 'icon', $feature );
			$this->assertArrayHasKey( 'status', $feature );
			$this->assertArrayHasKey( 'manage_url', $feature );
			$this->assertArrayHasKey( 'learn_more_route', $feature );
			$this->assertArrayHasKey( 'product', $feature );
			$this->assertArrayHasKey( 'module', $feature );
			$this->assertArrayHasKey( 'essential', $feature );
			$this->assertArrayHasKey( 'has_standalone_plugin', $feature );
			$this->assertArrayHasKey( 'standalone_plugin_url', $feature );

			$this->assertContains(
				$feature['status'],
				array( Main_Features::STATUS_ACTIVE, Main_Features::STATUS_INACTIVE )
			);
		}
	}

	/**
	 * The list arrives sorted so the UI can render it without sorting again.
	 */
	public function test_features_are_sorted_alphabetically_by_name() {
		$names = array_column( Main_Features::get_features(), 'name' );

		$sorted = $names;
		usort( $sorted, 'strnatcasecmp' );

		$this->assertSame( $sorted, $names );
	}

	/**
	 * A feature with no interstitial must say so rather than emit a route that 404s.
	 */
	public function test_features_without_an_interstitial_have_an_empty_learn_more_route() {
		$features = array_column( Main_Features::get_features(), 'learn_more_route', 'slug' );

		$this->assertSame( '/add-backup', $features['backup'] );
		$this->assertSame( '', $features['activity-log'] );
		$this->assertSame( '', $features['podcast'] );
	}

	/**
	 * The UI reads live state through these keys, so a product-backed feature must name
	 * a product the registry actually knows.
	 */
	public function test_product_join_keys_resolve_to_real_products() {
		foreach ( Main_Features::get_features() as $feature ) {
			if ( '' === $feature['product'] ) {
				continue;
			}

			$this->assertNotNull(
				Products::get_product_class( $feature['product'] ),
				"Feature {$feature['slug']} names an unknown product: {$feature['product']}"
			);
		}
	}

	/**
	 * A feature switched by neither a product nor a module has nothing to toggle, so the
	 * UI can only link to it. Only Activity Log is allowed in that state.
	 */
	public function test_only_activity_log_has_no_product_or_module() {
		$unswitchable = array();

		foreach ( Main_Features::get_features() as $feature ) {
			if ( '' === $feature['product'] && '' === $feature['module'] ) {
				$unswitchable[] = $feature['slug'];
			}
		}

		$this->assertSame( array( 'activity-log' ), $unswitchable );
	}

	/**
	 * The essential set is what a site is nudged towards, so it is asserted explicitly
	 * rather than left to whoever edits the catalog next.
	 */
	public function test_essential_features_are_the_expected_four() {
		$essential = array();

		foreach ( Main_Features::get_features() as $feature ) {
			if ( $feature['essential'] ) {
				$essential[] = $feature['slug'];
			}
		}

		$this->assertSame( array( 'boost', 'jetpack-forms', 'protect', 'stats' ), $essential );
	}

	/**
	 * The More features tab is the modules screen minus this set, so a module leaving or
	 * joining it silently moves between two lists. Pinned so that has to be deliberate.
	 */
	public function test_covered_modules_are_the_expected_set() {
		$covered = Main_Features::get_covered_modules();
		sort( $covered );

		$this->assertSame(
			array(
				'ai',
				'blaze',
				'contact-form',
				'podcast',
				'protect',
				'publicize',
				'search',
				'stats',
				'subscriptions',
				'videopress',
			),
			$covered
		);
	}

	/**
	 * A module in two groups would render twice; one in a group the features list
	 * already covers would render above and below at once.
	 */
	public function test_module_groups_are_disjoint_and_uncovered() {
		$covered = Main_Features::get_covered_modules();
		$seen    = array();

		foreach ( Main_Features::get_module_groups() as $group ) {
			$this->assertNotEmpty( $group['label'] );

			foreach ( $group['modules'] as $slug ) {
				$this->assertNotContains( $slug, $seen, "{$slug} appears in two groups" );
				$this->assertNotContains(
					$slug,
					$covered,
					"{$slug} is grouped but already covered by a feature"
				);
				$seen[] = $slug;
			}
		}
	}

	/**
	 * Slugs are the join key between the catalog and the UI, so they must be unique.
	 */
	public function test_feature_slugs_are_unique() {
		$slugs = array_column( Main_Features::get_features(), 'slug' );

		$this->assertSame( array_unique( $slugs ), $slugs );
	}

	/**
	 * The Features tab renders a screenshot for every card, so a missing one leaves a hole
	 * in the grid rather than a degraded card.
	 */
	public function test_every_feature_has_a_screenshot() {
		foreach ( Main_Features::get_features() as $feature ) {
			$this->assertNotSame(
				'',
				$feature['screenshot'],
				"Feature {$feature['slug']} has no screenshot."
			);
		}
	}

	/**
	 * Every feature is documented, so a support link is never optional.
	 */
	public function test_every_feature_has_a_docs_url() {
		foreach ( Main_Features::get_features() as $feature ) {
			$this->assertNotSame(
				'',
				$feature['docs_url'],
				"Feature {$feature['slug']} has no docs URL."
			);
		}
	}

	/**
	 * These are rendered as links and images straight into the page, so a typo'd or
	 * non-https value would ship a broken card or a mixed-content warning.
	 */
	public function test_urls_are_absolute_https() {
		foreach ( Main_Features::get_features() as $feature ) {
			foreach ( array( 'screenshot', 'info_url', 'docs_url' ) as $key ) {
				$url = $feature[ $key ];

				if ( '' === $url ) {
					continue;
				}

				$this->assertNotFalse(
					filter_var( $url, FILTER_VALIDATE_URL ),
					"Feature {$feature['slug']} has an invalid {$key}: {$url}"
				);
				$this->assertSame(
					'https',
					wp_parse_url( $url, PHP_URL_SCHEME ),
					"Feature {$feature['slug']} has a non-https {$key}: {$url}"
				);
			}
		}
	}

	/**
	 * Pinned so a product gaining or losing its own plugin has to be a deliberate change.
	 */
	public function test_standalone_plugins_are_the_expected_set() {
		$urls = array();

		foreach ( Main_Features::get_features() as $feature ) {
			if ( $feature['has_standalone_plugin'] ) {
				$urls[ $feature['slug'] ] = $feature['standalone_plugin_url'];
			}
		}
		ksort( $urls );

		$this->assertSame(
			array(
				'anti-spam'  => 'https://wordpress.org/plugins/akismet/',
				'backup'     => 'https://wordpress.org/plugins/jetpack-backup/',
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
	 * The flag and the URL must agree, and the displayed plugin name must match both.
	 */
	public function test_standalone_flag_url_and_delivery_name_agree() {
		foreach ( Main_Features::get_features() as $feature ) {
			$this->assertSame(
				$feature['has_standalone_plugin'],
				'' !== $feature['standalone_plugin_url'],
				"Feature {$feature['slug']} has a standalone flag and URL that disagree."
			);
			$this->assertSame(
				$feature['has_standalone_plugin'],
				! empty( $feature['delivery']['standalone'] ),
				"Feature {$feature['slug']} names a standalone plugin it does not have, or vice versa."
			);
		}
	}

	/**
	 * Every feature has a product page to send people to.
	 */
	public function test_every_feature_has_an_info_url() {
		foreach ( Main_Features::get_features() as $feature ) {
			$this->assertNotSame(
				'',
				$feature['info_url'],
				"Feature {$feature['slug']} has no info URL."
			);
		}
	}

	/**
	 * Pinned so a feature losing or gaining a free tier has to be a deliberate change.
	 */
	public function test_only_backup_and_blaze_cannot_be_used_without_paying() {
		$paid_only = array();

		foreach ( Main_Features::get_features() as $feature ) {
			$this->assertIsBool( $feature['delivery']['free'], "Feature {$feature['slug']} has no free flag." );

			if ( ! $feature['delivery']['free'] ) {
				$paid_only[] = $feature['slug'];
			}
		}

		sort( $paid_only );

		$this->assertSame( array( 'backup', 'blaze' ), $paid_only );
	}

	/**
	 * A feature that can be upgraded must say what to buy.
	 */
	public function test_features_with_paid_highlights_name_a_paid_product() {
		foreach ( Main_Features::get_features() as $feature ) {
			if ( empty( $feature['paid_highlights'] ) ) {
				continue;
			}

			$this->assertNotSame(
				'',
				$feature['paid_product'],
				"Feature {$feature['slug']} lists paid highlights but no paid product."
			);
		}
	}
}
