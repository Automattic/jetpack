<?php
/**
 * Tests for the Upgrade to Parse.ly prompts.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once dirname( __DIR__, 2 ) . '/src/promos.php';
require_once dirname( __DIR__, 2 ) . '/src/parsely-promo.php';
require_once dirname( __DIR__, 2 ) . '/src/parsely-prompts.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_parsely_promos
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_parsely_promos
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_parsely_promos' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_parsely_promos' )]
class Parsely_Promo_Test extends BaseTestCase {

	/**
	 * Drop the filters and the registry the prompts were registered into.
	 */
	public function tear_down() {
		remove_all_filters( OFFERS_PARSELY_PROMPTS_FILTER );
		remove_all_actions( 'init' );

		$instance = new \ReflectionProperty( Promo_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Registers the prompts and returns one registry entry.
	 *
	 * @param string $slug Promo identifier.
	 * @return Promo|null
	 */
	private function register( $slug ) {
		register_parsely_promos();

		return Promo_Registry::get_instance()->get_all_registered()[ $slug ] ?? null;
	}

	public function test_the_prompts_wait_for_init_before_translating_their_copy() {
		$fired = $GLOBALS['wp_actions']['init'] ?? null;
		unset( $GLOBALS['wp_actions']['init'] );

		try {
			configure_parsely_promos();

			$this->assertSame( array(), Promo_Registry::get_instance()->get_all_registered() );
			$this->assertNotFalse( has_action( 'init', __NAMESPACE__ . '\\register_parsely_promos' ) );
		} finally {
			if ( null !== $fired ) {
				$GLOBALS['wp_actions']['init'] = $fired;
			}
		}
	}

	public function test_the_prompts_register_at_once_when_init_has_already_run() {
		do_action( 'init' );

		configure_parsely_promos();

		$this->assertArrayHasKey( 'parsely/settings-upgrade', Promo_Registry::get_instance()->get_all_registered() );
	}

	public function test_the_card_is_registered_for_the_settings_page() {
		$promo = $this->register( 'parsely/settings-upgrade' );

		$this->assertInstanceOf( Promo::class, $promo );
		$this->assertSame( 'settings', $promo->placement );
		$this->assertSame( 'Parse.ly', $promo->title );
		$this->assertSame( 'Upgrade to Parse.ly', $promo->cta_label );
		$this->assertStringStartsWith( PARSELY_SIGNUP_URL, $promo->cta_url );
	}

	public function test_the_card_is_outlined_and_cannot_be_dismissed() {
		$promo = $this->register( 'parsely/settings-upgrade' );

		$this->assertSame( 'secondary', $promo->cta_variant );
		$this->assertFalse( $promo->dismissible );
	}

	public function test_the_menu_item_is_registered_for_the_options_menu() {
		$promo = $this->register( 'parsely/menu-upgrade' );

		$this->assertInstanceOf( Promo::class, $promo );
		$this->assertSame( 'options-menu', $promo->placement );
		$this->assertSame( 'Upgrade to Parse.ly', $promo->cta_label );
		$this->assertStringStartsWith( PARSELY_SIGNUP_URL, $promo->cta_url );
		$this->assertFalse( $promo->dismissible );
	}

	/**
	 * @param string $slug Promo identifier.
	 * @dataProvider provide_prompt_slugs
	 */
	#[DataProvider( 'provide_prompt_slugs' )]
	public function test_each_prompt_shows_only_where_the_gate_passes( string $slug ) {
		$promo = $this->register( $slug );

		add_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_false' );
		$this->assertFalse( $promo->is_available() );

		remove_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_false' );
		add_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_true' );
		$this->assertTrue( $promo->is_available() );
	}

	/**
	 * @return array<string, array{string}>
	 */
	public static function provide_prompt_slugs() {
		return array(
			'settings card' => array( 'parsely/settings-upgrade' ),
			'menu item'     => array( 'parsely/menu-upgrade' ),
		);
	}
}
