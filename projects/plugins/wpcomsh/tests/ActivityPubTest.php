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
	 * Tests that the filter hook is registered.
	 */
	public function test_filter_is_registered() {
		$this->assertSame(
			20,
			has_filter( 'jetpack_sync_before_enqueue_activated_plugin', 'wpcomsh_activitypub_sync_plugin_activation' )
		);
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
	 * Tests that actor data is appended when the ActivityPub plugin is activated
	 * and the actor is found successfully.
	 */
	public function test_appends_actor_data_when_actor_is_found() {
		$actor_id = 'https://example.com/author/test';

		\Activitypub\Collection\Actors::set_mock_return(
			new \Activitypub\Collection\Actor( $actor_id )
		);

		$args   = array( 'activitypub/activitypub.php', false );
		$result = wpcomsh_activitypub_sync_plugin_activation( $args );

		$this->assertCount( 3, $result );
		$this->assertSame( 'activitypub/activitypub.php', $result[0] );
		$this->assertFalse( $result[1] );
		$this->assertSame( array( 'actor' => $actor_id ), $result[2] );
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
