<?php
/**
 * Tests for the Upgrade to Parse.ly card.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once dirname( __DIR__, 2 ) . '/src/promos.php';
require_once dirname( __DIR__, 2 ) . '/src/parsely-promo.php';
require_once dirname( __DIR__, 2 ) . '/src/parsely-prompts.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_parsely_promo
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_parsely_promo' )]
class Parsely_Promo_Test extends BaseTestCase {

	/**
	 * Drop the filters and the registry the card was registered into.
	 */
	public function tear_down() {
		remove_all_filters( OFFERS_PARSELY_PROMPTS_FILTER );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );

		$instance = new \ReflectionProperty( Promo_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Registers the card and returns the registry's entry.
	 *
	 * @return Promo|null
	 */
	private function register() {
		register_parsely_promo();

		return Promo_Registry::get_instance()->get_registered( 'parsely/settings-upgrade' );
	}

	public function test_the_card_is_registered_for_the_settings_page() {
		$promo = $this->register();

		$this->assertInstanceOf( Promo::class, $promo );
		$this->assertSame( 'settings', $promo->placement );
		$this->assertSame( 'Parse.ly', $promo->title );
		$this->assertSame( 'Upgrade to Parse.ly', $promo->cta_label );
		$this->assertStringStartsWith( PARSELY_SIGNUP_URL, $promo->cta_url );
	}

	public function test_the_card_is_outlined_and_cannot_be_dismissed() {
		$promo = $this->register();

		$this->assertSame( 'secondary', $promo->cta_variant );
		$this->assertFalse( $promo->dismissible );
	}

	public function test_the_card_shows_only_where_the_gate_passes() {
		$promo = $this->register();

		add_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_false' );
		$this->assertFalse( $promo->is_available() );

		remove_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_false' );
		add_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_true' );
		$this->assertTrue( $promo->is_available() );
	}

	public function test_registering_twice_leaves_the_first_card_in_place() {
		$first   = $this->register();
		$notices = 0;
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			static function () use ( &$notices ) {
				++$notices;
			}
		);

		register_parsely_promo();

		$this->assertSame( 0, $notices );
		$this->assertSame( $first, Promo_Registry::get_instance()->get_registered( 'parsely/settings-upgrade' ) );
	}
}
