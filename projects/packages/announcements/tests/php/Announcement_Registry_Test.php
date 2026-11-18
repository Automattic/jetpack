<?php
/**
 * Tests for the announcement registry.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Announcements\Announcement_Registry
 * @covers ::Automattic\Jetpack\Announcements\register_announcement
 */
#[CoversClass( Announcement_Registry::class )]
#[CoversFunction( 'Automattic\Jetpack\Announcements\register_announcement' )]
class Announcement_Registry_Test extends BaseTestCase {

	const VALID_ARGS = array(
		'date'     => '2026-11-20',
		'title'    => 'Arrange your tabs',
		'channels' => array( 'premium-analytics' ),
	);

	/**
	 * Functions reported through _doing_it_wrong() during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * Capture _doing_it_wrong() instead of letting it raise a notice.
	 */
	public function set_up() {
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
	 * Drop the capture, the registrants and the main instance.
	 */
	public function tear_down() {
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
		remove_all_actions( Announcement_Registry::REGISTER_ACTION );

		$instance = new \ReflectionProperty( Announcement_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	public function test_stores_a_sanitized_record() {
		$registry = new Announcement_Registry();

		$announcement = $registry->register(
			'premium-analytics/arrange-tabs',
			array(
				'date'       => '2026-11-20T10:00:00+02:00',
				'title'      => 'Arrange <b>your</b> tabs',
				'excerpt'    => "Put the tabs you use most\nfirst.",
				'content'    => '<p onclick="alert( 1 )">Open <a href="https://example.com/">Settings</a>.</p>',
				'media'      => array(
					'type' => 'image',
					'url'  => 'https://example.com/tabs.png',
					'alt'  => 'The <i>tabs</i> menu',
				),
				'link'       => 'https://example.com/whats-new/tabs',
				'channels'   => array( 'Premium-Analytics', 'premium-analytics', 'my jetpack' ),
				'capability' => 'manage_options',
			)
		);

		$this->assertSame(
			array(
				'id'         => 'premium-analytics/arrange-tabs',
				'date'       => '2026-11-20T08:00:00+00:00',
				'title'      => 'Arrange your tabs',
				'excerpt'    => 'Put the tabs you use most first.',
				'content'    => '<p>Open <a href="https://example.com/">Settings</a>.</p>',
				'media'      => array(
					'type' => 'image',
					'url'  => 'https://example.com/tabs.png',
					'alt'  => 'The tabs menu',
				),
				'link'       => 'https://example.com/whats-new/tabs',
				'channels'   => array( 'premium-analytics', 'myjetpack' ),
				'capability' => 'manage_options',
			),
			$announcement
		);
		$this->assertSame( array(), $this->doing_it_wrong );
	}

	/**
	 * @dataProvider provide_refused_registrations
	 *
	 * @param mixed $id   Announcement id.
	 * @param mixed $args Announcement args.
	 */
	#[DataProvider( 'provide_refused_registrations' )]
	public function test_refuses_an_unusable_registration( $id, $args ) {
		$registry = new Announcement_Registry();

		$this->assertFalse( $registry->register( $id, $args ) );
		$this->assertSame( array( __NAMESPACE__ . '\register_announcement' ), $this->doing_it_wrong );
		$this->assertFalse( is_string( $id ) && $registry->is_registered( $id ) );
	}

	public static function provide_refused_registrations() {
		return array(
			'id without a namespace' => array( 'arrange-tabs', self::VALID_ARGS ),
			'id with uppercase'      => array( 'Premium-Analytics/arrange-tabs', self::VALID_ARGS ),
			'id that is no string'   => array( 12, self::VALID_ARGS ),
			'no date'                => array( 'a/b', array_diff_key( self::VALID_ARGS, array( 'date' => 1 ) ) ),
			'date that is no date'   => array( 'a/b', array_merge( self::VALID_ARGS, array( 'date' => 'tomorrow' ) ) ),
			'date that never comes'  => array( 'a/b', array_merge( self::VALID_ARGS, array( 'date' => '2026-02-30' ) ) ),
			'no title'               => array( 'a/b', array_merge( self::VALID_ARGS, array( 'title' => ' ' ) ) ),
			'no channels'            => array( 'a/b', array_merge( self::VALID_ARGS, array( 'channels' => array() ) ) ),
			'args that are no array' => array( 'a/b', 'Arrange your tabs' ),
		);
	}

	public function test_refuses_a_duplicate_id_and_keeps_the_first() {
		$registry = new Announcement_Registry();
		$registry->register( 'a/b', self::VALID_ARGS );

		$duplicate = $registry->register( 'a/b', array_merge( self::VALID_ARGS, array( 'title' => 'Another title' ) ) );

		$this->assertFalse( $duplicate );
		$this->assertSame( 'Arrange your tabs', $registry->get_all_registered()['a/b']['title'] );
	}

	public function test_fires_the_registration_action_once_and_the_helper_registers_there() {
		$runs = 0;
		add_action(
			Announcement_Registry::REGISTER_ACTION,
			static function () use ( &$runs ) {
				++$runs;
				register_announcement( 'a/b', self::VALID_ARGS );
			}
		);
		$registry = Announcement_Registry::get_instance();

		$registry->get_all_registered();
		$registry->get_registered( 'a/b' );

		$this->assertSame( 1, $runs );
		$this->assertSame( array( 'a/b' ), array_keys( $registry->get_all_registered() ) );
		$this->assertSame( array(), $this->doing_it_wrong );
	}

	/**
	 * @dataProvider provide_early_reads
	 *
	 * @param bool $during_init Whether the read happens while `init` runs, instead of before it.
	 */
	#[DataProvider( 'provide_early_reads' )]
	public function test_a_read_before_init_ends_reports_it_and_leaves_the_registry_to_hydrate_later( $during_init ) {
		global $wp_actions, $wp_current_filter;
		$init_runs = $wp_actions['init'] ?? null;
		if ( $during_init ) {
			// Core counts an action before it runs the callbacks.
			$wp_actions['init']  = 1;
			$wp_current_filter[] = 'init';
		} else {
			unset( $wp_actions['init'] );
		}
		add_action(
			Announcement_Registry::REGISTER_ACTION,
			static function ( $registry ) {
				$registry->register( 'a/b', self::VALID_ARGS );
			}
		);
		$registry = new Announcement_Registry();

		try {
			$early = $registry->get_all_registered();
		} finally {
			$wp_actions['init'] = $init_runs;
			if ( $during_init ) {
				array_pop( $wp_current_filter );
			}
		}

		$this->assertSame( array(), $early );
		$this->assertSame( array( Announcement_Registry::class ), $this->doing_it_wrong );
		$this->assertSame( array( 'a/b' ), array_keys( $registry->get_all_registered() ) );
	}

	public static function provide_early_reads() {
		return array(
			'before init'     => array( false ),
			'while init runs' => array( true ),
		);
	}
}
