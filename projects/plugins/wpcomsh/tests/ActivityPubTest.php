<?php
/**
 * ActivityPub Test file.
 *
 * @package wpcomsh
 */

/**
 * Class ActivityPubTest.
 */
class ActivityPubTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up the mock connection owner ID before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Set the memoized connection_owner_id to a valid user ID
		// so tests reach the Actors::get_by_id() code path.
		$prop = new \ReflectionProperty( \Automattic\Jetpack\Connection\Manager::class, 'connection_owner_id' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, 1 );
	}

	/**
	 * Reset the mock connection owner ID after each test.
	 */
	public function tear_down() {
		$prop = new \ReflectionProperty( \Automattic\Jetpack\Connection\Manager::class, 'connection_owner_id' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Tests that the filter hook is registered.
	 */
	public function test_filter_is_registered() {
		$this->assertSame(
			20,
			has_filter( 'jetpack_sync_before_enqueue_activated_plugin', 'wpcomsh_activitypub_sync_plugin_activation' )
		);
	}

	/**
	 * Tests that false is returned unchanged when a previous filter aborted.
	 */
	public function test_returns_false_when_previous_filter_aborted() {
		$result = wpcomsh_activitypub_sync_plugin_activation( false );

		$this->assertFalse( $result );
	}

	/**
	 * Tests that args are returned unchanged when the plugin is not ActivityPub.
	 */
	public function test_returns_args_unchanged_for_other_plugins() {
		$args   = array( 'some-other-plugin/some-other-plugin.php', false );
		$result = wpcomsh_activitypub_sync_plugin_activation( $args );

		$this->assertSame( $args, $result );
	}

	/**
	 * Tests that args are returned unchanged when there is no Jetpack connection owner.
	 */
	public function test_returns_args_unchanged_when_no_connection_owner() {
		$prop = new \ReflectionProperty( \Automattic\Jetpack\Connection\Manager::class, 'connection_owner_id' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, 0 );

		$args   = array( 'activitypub/activitypub.php', false );
		$result = wpcomsh_activitypub_sync_plugin_activation( $args );

		$this->assertCount( 2, $result );
		$this->assertSame( $args, $result );
	}

	/**
	 * Tests that actor data is appended when the ActivityPub plugin is activated
	 * and the actor is found successfully.
	 */
	public function test_appends_actor_data_when_actor_is_found() {
		$actor_id  = 'https://example.com/author/test';
		$webfinger = 'test@example.com';

		\Activitypub\Collection\Actors::set_mock_return(
			new \Activitypub\Collection\Actor( $actor_id, $webfinger )
		);

		$args   = array( 'activitypub/activitypub.php', false );
		$result = wpcomsh_activitypub_sync_plugin_activation( $args );

		$this->assertCount( 3, $result );
		$this->assertSame( 'activitypub/activitypub.php', $result[0] );
		$this->assertFalse( $result[1] );
		$this->assertSame(
			array(
				'actor'     => $actor_id,
				'webfinger' => $webfinger,
			),
			$result[2]
		);
	}

	/**
	 * Tests that actor data is not appended when get_by_id returns a WP_Error.
	 */
	public function test_does_not_append_actor_data_when_wp_error() {
		\Activitypub\Collection\Actors::set_mock_return(
			new \WP_Error( 'actor_not_found', 'Actor not found' )
		);

		$args   = array( 'activitypub/activitypub.php', false );
		$result = wpcomsh_activitypub_sync_plugin_activation( $args );

		$this->assertCount( 2, $result );
		$this->assertSame( $args, $result );
	}
}
