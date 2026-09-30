<?php
/**
 * Tests for Marketplace plugins in core's plugin search results.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Marketplace_Catalog;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-plugins/wpcom-marketplace-tab.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-plugins/wpcom-marketplace-search.php';

/**
 * Class Wpcom_Marketplace_Search_Test
 */
class Wpcom_Marketplace_Search_Test extends \WorDBless\BaseTestCase {

	/**
	 * Per-flag filter, so toggling ours leaves every other flag alone.
	 *
	 * @var string
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . WPCOM_MARKETPLACE_TAB_FLAG;

	/**
	 * A card, as the catalog normalizes one.
	 *
	 * @param string $slug        Plugin slug.
	 * @param string $name        Plugin name.
	 * @param string $description Short description.
	 * @return array
	 */
	private function card( $slug, $name, $description = 'Does useful things.' ) {
		return Marketplace_Catalog::to_card(
			array(
				'slug'              => $slug,
				'name'              => $name,
				'short_description' => $description,
			)
		);
	}

	/**
	 * Puts a catalog in place, in sales order, without going near the network.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$products = array();
		foreach (
			array(
				$this->card( 'usps', 'USPS Shipping Method' ),
				$this->card( 'bookings', 'Bookings', 'Take bookings, with shipping for physical rentals.' ),
				$this->card( 'table-rate', 'Table Rate Shipping' ),
				$this->card( 'yoast', 'Yoast SEO Premium' ),
			) as $card
		) {
			$products[ $card['slug'] ] = $card;
		}

		set_transient( Marketplace_Catalog::LIST_CACHE_KEY, $products, HOUR_IN_SECONDS );
	}

	/**
	 * Clean up.
	 *
	 * @return void
	 */
	public function tear_down() {
		delete_transient( Marketplace_Catalog::LIST_CACHE_KEY );
		delete_site_transient( 'update_plugins' );
		remove_filter( self::FLAG_FILTER, '__return_true' );
		remove_all_filters( 'plugins_api_result' );
		remove_all_filters( 'plugin_install_action_links' );
		remove_all_filters( 'plugin_install_description' );

		parent::tear_down();
	}

	/**
	 * A keyword search's results, as core's plugin API returns them.
	 *
	 * @param string[] $slugs WordPress.org slugs.
	 * @return object
	 */
	private function results( array $slugs ) {
		return (object) array(
			'info'    => array( 'results' => count( $slugs ) ),
			'plugins' => array_map(
				function ( $slug ) {
					return array( 'slug' => $slug );
				},
				$slugs
			),
		);
	}

	/**
	 * Only the Add Plugins screen, with the flag on, on its first page.
	 */
	public function test_it_hooks_in_on_the_add_plugins_screen_only() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		$screen = WP_Screen::get( 'plugin-install' );

		wpcom_marketplace_search_start( $screen );
		$this->assertFalse( has_filter( 'plugins_api_result', 'wpcom_marketplace_splice_search_results' ), 'Flag off.' );

		add_filter( self::FLAG_FILTER, '__return_true' );
		wpcom_marketplace_search_start( WP_Screen::get( 'plugins' ) );
		$this->assertFalse( has_filter( 'plugins_api_result', 'wpcom_marketplace_splice_search_results' ), 'Other screen.' );

		wpcom_marketplace_search_start( $screen );
		$this->assertSame( 10, has_filter( 'plugins_api_result', 'wpcom_marketplace_splice_search_results' ) );
		$this->assertSame( 10, has_filter( 'plugin_install_action_links', 'wpcom_marketplace_search_action_links' ) );
		$this->assertSame( 10, has_filter( 'plugin_install_description', 'wpcom_marketplace_search_description' ) );
	}

	/**
	 * A name match outranks a description match, and the catalog's sales order holds within each.
	 */
	public function test_matches_rank_the_name_first_then_sales() {
		$this->assertSame( array( 'usps', 'table-rate' ), array_column( wpcom_marketplace_search_matches( 'Shipping', 2 ), 'slug' ) );
		$this->assertSame( array( 'usps', 'table-rate', 'bookings' ), array_column( wpcom_marketplace_search_matches( 'shipping', 5 ), 'slug' ) );
	}

	/**
	 * Two letters match half of any catalog.
	 */
	public function test_short_terms_match_nothing() {
		$this->assertSame( array(), wpcom_marketplace_search_matches( 'se', 2 ) );
		$this->assertSame( array( 'yoast' ), array_column( wpcom_marketplace_search_matches( 'seo', 2 ), 'slug' ) );
	}

	/**
	 * Matches lead the first page, and a WordPress.org copy of one is not listed twice.
	 */
	public function test_matches_lead_the_first_page_of_a_keyword_search() {
		$result = wpcom_marketplace_splice_search_results(
			$this->results( array( 'flexible-shipping', 'usps' ) ),
			'query_plugins',
			(object) array( 'search' => 'shipping' )
		);

		$this->assertSame( array( 'usps', 'table-rate', 'flexible-shipping' ), array_column( $result->plugins, 'slug' ) );
	}

	/**
	 * Browse tabs, later pages and other plugin API calls are left as core returned them.
	 */
	public function test_everything_but_a_first_page_keyword_search_is_untouched() {
		$results = $this->results( array( 'flexible-shipping' ) );

		$this->assertSame( $results, wpcom_marketplace_splice_search_results( $results, 'query_plugins', (object) array( 'browse' => 'featured' ) ) );
		$this->assertSame(
			array( 'flexible-shipping' ),
			array_column(
				wpcom_marketplace_splice_search_results(
					$this->results( array( 'flexible-shipping' ) ),
					'query_plugins',
					(object) array(
						'search' => 'shipping',
						'page'   => 2,
					)
				)->plugins,
				'slug'
			)
		);
		$this->assertSame( $results, wpcom_marketplace_splice_search_results( $results, 'plugin_information', (object) array( 'search' => 'shipping' ) ) );
	}

	/**
	 * Core's Install Now would fetch the slug from WordPress.org, which has none of these.
	 */
	public function test_our_cards_get_the_marketplace_action() {
		$links = array( '<a class="install-now button">Install Now</a>', '<a>More Details</a>' );

		$ours = wpcom_marketplace_search_action_links( $links, $this->card( 'usps', 'USPS Shipping Method' ) );
		$this->assertStringNotContainsString( 'install-now', $ours[0] );
		$this->assertSame( '<a>More Details</a>', $ours[1] );

		$this->assertSame( $links, wpcom_marketplace_search_action_links( $links, array( 'slug' => 'flexible-shipping' ) ) );
	}

	/**
	 * Our cards are labelled, and carry the price their strip shows instead of WordPress.org's stats.
	 */
	public function test_our_cards_are_labelled_and_carry_their_price() {
		$card = Marketplace_Catalog::attach_pricing(
			array( 'usps' => array_merge( $this->card( 'usps', 'USPS Shipping Method' ), array( 'wpcom_variations' => array( 'yearly' => 1 ) ) ) ),
			array(
				1 => array(
					'slug'  => 'usps_yearly',
					'price' => '$109.00',
					'cost'  => 109.0,
				),
			)
		)['usps'];

		$html = wpcom_marketplace_search_description( 'Core description.', $card );

		$this->assertStringContainsString( '<span class="wpcom-marketplace-label">WordPress.com Marketplace</span>', $html );
		$this->assertMatchesRegularExpression( '#<template class="wpcom-marketplace-strip">.*\$109\.00.*</template>#s', $html );
		$this->assertSame( 'Core description.', wpcom_marketplace_search_description( 'Core description.', array( 'slug' => 'other' ) ) );
	}

	/**
	 * An installed plugin's strip empties rather than showing a price or WordPress.org's stats.
	 */
	public function test_an_installed_plugins_strip_is_empty() {
		set_site_transient(
			'update_plugins',
			(object) array(
				'response' => array(
					'usps/usps.php' => (object) array(
						'slug'        => 'usps',
						'new_version' => '9.9.9',
					),
				),
			)
		);

		$this->assertStringContainsString(
			'<template class="wpcom-marketplace-strip"></template>',
			wpcom_marketplace_search_description( '', $this->card( 'usps', 'USPS Shipping Method' ) )
		);
	}
}
