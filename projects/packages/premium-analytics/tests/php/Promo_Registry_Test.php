<?php
/**
 * Tests for the promo registry.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Promo_Registry
 */
#[CoversClass( Promo_Registry::class )]
class Promo_Registry_Test extends BaseTestCase {

	/**
	 * _doing_it_wrong() method names captured during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
	 *
	 * @return void
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) {
				$this->doing_it_wrong[] = $function_name;
			}
		);
	}

	/**
	 * Drop the promos a test registered.
	 */
	public function tear_down() {
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
	 * Asserts a registration is refused and leaves the registry untouched.
	 *
	 * @param string $slug Promo slug.
	 * @param array  $args Promo arguments.
	 */
	private function assert_refused( $slug, $args ) {
		$this->capture_doing_it_wrong();

		$registry = new Promo_Registry();

		$this->assertFalse( $registry->register( $slug, $args ) );
		$this->assertFalse( $registry->is_registered( $slug ) );
		$this->assertSame( array( Promo_Registry::class . '::register' ), $this->doing_it_wrong );
	}

	public function test_register_refuses_a_duplicate_slug() {
		$this->capture_doing_it_wrong();

		$registry = new Promo_Registry();
		$args     = array(
			'placement' => 'settings',
			'title'     => 'Try Acme',
		);
		$first    = $registry->register( 'acme/offer', $args );

		$this->assertFalse( $registry->register( 'acme/offer', array( 'placement' => 'settings' ) + array( 'title' => 'Something else' ) ) );
		$this->assertSame( array( 'acme/offer' => $first ), $registry->get_all_registered() );
		$this->assertSame( array( Promo_Registry::class . '::register' ), $this->doing_it_wrong );
	}

	public function test_register_refuses_an_unknown_placement() {
		$this->assert_refused( 'acme/offer', array( 'placement' => 'sidebar' ) );
	}

	public function test_register_refuses_a_card_promo_without_a_title() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'   => 'settings',
				'description' => 'Acme makes everything better.',
			)
		);
	}

	public function test_registration_refuses_an_unknown_cta_variant() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'   => 'settings',
				'title'       => 'Offer',
				'cta_variant' => 'outline',
			)
		);
	}


	public function test_register_refuses_an_options_menu_promo_without_a_cta_label() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement' => 'options-menu',
				'cta_url'   => 'https://example.com/acme',
			)
		);
	}

	public function test_register_returns_the_promo_on_success() {
		$registry = new Promo_Registry();

		$promo = $registry->register(
			'acme/offer',
			array(
				'placement' => 'settings',
				'title'     => 'Try Acme',
			)
		);

		$this->assertInstanceOf( Promo::class, $promo );
		$this->assertSame( 'acme/offer', $promo->slug );
		$this->assertSame( array( 'acme/offer' => $promo ), $registry->get_all_registered() );
	}

	public function test_register_accepts_an_options_menu_promo_the_menu_can_render() {
		$registry = new Promo_Registry();

		$promo = $registry->register(
			'acme/offer',
			array(
				'placement' => 'options-menu',
				'cta_label' => 'Try Acme',
				'cta_url'   => 'https://example.com/acme',
			)
		);

		$this->assertInstanceOf( Promo::class, $promo );
	}

	/**
	 * @param mixed $cta_url A cta_url the dashboard cannot link to.
	 * @dataProvider provide_unlinkable_cta_urls
	 */
	#[DataProvider( 'provide_unlinkable_cta_urls' )]
	public function test_register_refuses_a_cta_label_the_dashboard_cannot_link( $cta_url ) {
		$args = array(
			'placement' => 'options-menu',
			'cta_label' => 'Try Acme',
		);

		if ( null !== $cta_url ) {
			$args['cta_url'] = $cta_url;
		}

		$this->assert_refused( 'acme/offer', $args );
	}

	public static function provide_unlinkable_cta_urls() {
		return array(
			'absent'          => array( null ),
			'empty'           => array( '' ),
			'no scheme'       => array( 'example.com/acme' ),
			'javascript'      => array( 'javascript:alert(1)' ), // phpcs:ignore Generic.Strings.UnnecessaryStringConcat.Found
			'data'            => array( 'data:text/html,<p>hi</p>' ),
			'site relative'   => array( '/acme' ),
			'protocol scheme' => array( '//example.com/acme' ),
		);
	}

	public function test_the_gated_list_is_computed_once_per_request() {
		$registry = new Promo_Registry();
		$calls    = 0;
		$compute  = function () use ( &$calls ) {
			++$calls;
			return array();
		};

		$first  = $registry->remember_available( $compute );
		$second = $registry->remember_available( $compute );

		$this->assertSame( 1, $calls );
		$this->assertSame( $first, $second );
	}
}
