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
	 * Drop the registrants and the registry they hydrated.
	 */
	public function tear_down() {
		remove_all_actions( Promo_Registry::REGISTER_ACTION );
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

	public function test_register_refuses_a_slug_without_a_namespace() {
		$this->assert_refused( 'offer', array( 'placement' => 'settings' ) );
	}

	public function test_register_refuses_a_slug_that_is_not_lowercase() {
		$this->assert_refused( 'Acme/offer', array( 'placement' => 'settings' ) );
	}

	public function test_register_refuses_a_duplicate_slug() {
		$this->capture_doing_it_wrong();

		$registry = new Promo_Registry();
		$first    = $registry->register(
			'acme/offer',
			array(
				'placement' => 'settings',
				'title'     => 'Try Acme',
			)
		);

		$this->assertFalse(
			$registry->register(
				'acme/offer',
				array(
					'placement' => 'settings',
					'title'     => 'Try Acme',
				)
			)
		);
		$this->assertSame( $first, $registry->get_registered( 'acme/offer' ) );
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

	public function test_register_refuses_an_is_available_that_is_not_callable() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'    => 'settings',
				'title'        => 'Try Acme',
				'is_available' => 'acme_promo_rule_typo',
			)
		);
	}

	public function test_register_refuses_an_options_menu_promo_without_a_cta_label() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'   => 'options-menu',
				'cta_url'     => 'https://example.com/acme',
				'dismissible' => false,
			)
		);
	}

	public function test_register_refuses_a_dismissible_options_menu_promo() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'   => 'options-menu',
				'dismissible' => true,
			)
		);
	}

	public function test_register_refuses_an_options_menu_promo_that_leaves_dismissible_at_its_default() {
		$this->assert_refused( 'acme/offer', array( 'placement' => 'options-menu' ) );
	}

	public function test_register_refuses_a_render_module_on_an_options_menu_promo() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'     => 'options-menu',
				'dismissible'   => false,
				'render_module' => 'acme/render',
			)
		);
	}

	/**
	 * @return array<string, array{0: mixed}>
	 */
	public static function invalid_render_modules() {
		return array(
			'empty string' => array( '' ),
			'integer'      => array( 123 ),
			'array'        => array( array( 'acme/render' ) ),
		);
	}

	/**
	 * @dataProvider invalid_render_modules
	 *
	 * @param mixed $render_module Candidate render module.
	 */
	#[DataProvider( 'invalid_render_modules' )]
	public function test_register_refuses_a_render_module_that_is_not_a_non_empty_string( $render_module ) {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'     => 'settings',
				'render_module' => $render_module,
			)
		);
	}

	public function test_register_refuses_a_negative_snooze_days() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'   => 'settings',
				'title'       => 'Try Acme',
				'snooze_days' => -1,
			)
		);
	}

	public function test_register_refuses_snooze_days_on_a_promo_that_is_not_dismissible() {
		$this->assert_refused(
			'acme/offer',
			array(
				'placement'   => 'settings',
				'title'       => 'Try Acme',
				'dismissible' => false,
				'snooze_days' => 30,
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
		$this->assertTrue( $registry->is_registered( 'acme/offer' ) );
		$this->assertSame( $promo, $registry->get_registered( 'acme/offer' ) );
	}

	public function test_register_accepts_a_non_dismissible_options_menu_promo() {
		$registry = new Promo_Registry();

		$promo = $registry->register(
			'acme/offer',
			array(
				'placement'   => 'options-menu',
				'cta_label'   => 'Try Acme',
				'cta_url'     => 'https://example.com/acme',
				'dismissible' => false,
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
		$registry = new Promo_Registry();

		$args = array(
			'placement' => 'options-menu',
			'cta_label' => 'Try Acme',
		);

		if ( null !== $cta_url ) {
			$args['cta_url'] = $cta_url;
		}

		$this->capture_doing_it_wrong();

		$this->assertFalse( $registry->register( 'acme/offer', $args ) );
		$this->assertFalse( $registry->is_registered( 'acme/offer' ) );
		$this->assertSame( array( Promo_Registry::class . '::register' ), $this->doing_it_wrong );
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

	public function test_the_registration_action_fires_once_on_the_first_read_after_init() {
		do_action( 'init' );

		$calls = 0;
		add_action(
			Promo_Registry::REGISTER_ACTION,
			function ( $registry ) use ( &$calls ) {
				++$calls;
				$registry->register(
					'acme/offer',
					array(
						'placement' => 'settings',
						'title'     => 'Try Acme',
					)
				);
			}
		);

		$registry    = Promo_Registry::get_instance();
		$first_read  = $registry->get_all_registered();
		$second_read = $registry->get_all_registered();

		$this->assertSame( 1, $calls );
		$this->assertSame( $first_read, $second_read );
		$this->assertArrayHasKey( 'acme/offer', $second_read );
	}

	public function test_a_registrant_that_reads_the_registry_does_not_re_enter() {
		do_action( 'init' );

		$calls = 0;
		add_action(
			Promo_Registry::REGISTER_ACTION,
			function ( $registry ) use ( &$calls ) {
				++$calls;
				$registry->get_all_registered();
			}
		);

		Promo_Registry::get_instance()->get_all_registered();

		$this->assertSame( 1, $calls );
	}

	public function test_a_read_before_init_does_not_hydrate() {
		global $wp_actions;
		$init_runs = $wp_actions['init'] ?? null;
		unset( $wp_actions['init'] );
		$this->capture_doing_it_wrong();

		$called = false;
		add_action(
			Promo_Registry::REGISTER_ACTION,
			function () use ( &$called ) {
				$called = true;
			}
		);

		try {
			Promo_Registry::get_instance()->get_all_registered();
		} finally {
			if ( null !== $init_runs ) {
				$wp_actions['init'] = $init_runs;
			}
		}

		$this->assertFalse( $called );
		$this->assertSame( array( Promo_Registry::class . '::ensure_hydrated' ), $this->doing_it_wrong );
	}

	public function test_a_read_before_init_does_not_become_the_answer_for_the_request() {
		global $wp_actions;
		$init_runs = $wp_actions['init'] ?? null;
		unset( $wp_actions['init'] );
		$this->capture_doing_it_wrong();

		$registry = new Promo_Registry();
		$computed = 0;
		$compute  = function () use ( &$computed ) {
			++$computed;
			return array();
		};

		try {
			$registry->remember_available( $compute );
		} finally {
			if ( null !== $init_runs ) {
				$wp_actions['init'] = $init_runs;
			}
		}

		$promo = $registry->register(
			'acme/offer',
			array(
				'placement' => 'settings',
				'title'     => 'Grow with Acme',
			)
		);

		$this->assertSame(
			array( $promo ),
			$registry->remember_available(
				function () use ( $promo ) {
					return array( $promo );
				}
			)
		);
		$this->assertSame( 1, $computed );
	}
}
