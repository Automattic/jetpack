<?php
/**
 * Tests for the settings route.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_Environment;
use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Resources;
use Automattic\Jetpack\Sharing_Likes\Settings\Twitter_Site_Tag;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/class-jetpack-likes-settings.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';
require_once __DIR__ . '/../lib/trait-rest-requests.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\REST\Settings_Controller
 */
#[CoversClass( Settings_Controller::class )]
class Settings_Controller_Test extends BaseTestCase {

	use Section_Environment;
	use REST_Requests;

	/**
	 * Start every case as an administrator on a site with no theme, blocks or modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
		$this->set_up_rest();
		$this->log_in_as( 'administrator' );
	}

	/**
	 * Leave no options or constants behind.
	 */
	public function tear_down() {
		unset( $GLOBALS['sharing_likes_test_global_options'], $GLOBALS['sharing_likes_test_likes_show'] );

		foreach ( array( 'sharing-options', 'sharing-services', 'disabled_likes', 'disabled_reblogs', 'jetpack_comment_likes_enabled', Twitter_Site_Tag::OPTION, Sharing_Resources::OPTION ) as $option ) {
			delete_option( $option );
		}

		$this->tear_down_rest();
		$this->tear_down_site();
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * A connected Jetpack site running both legacy features on a classic theme.
	 */
	private function given_both_features_running(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy', 'likes' ) );
	}

	/**
	 * What the last save handed `Sharing_Service::set_global_options()`.
	 *
	 * @return array<string,mixed>
	 */
	private function saved_global_options(): array {
		$this->assertArrayHasKey( 'sharing_likes_test_global_options', $GLOBALS, 'Nothing reached set_global_options().' );

		return $GLOBALS['sharing_likes_test_global_options'];
	}

	public function test_offers_what_the_screen_shows_on_a_connected_site(): void {
		$this->given_both_features_running();

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertEqualsCanonicalizing(
			array( 'likes_enabled', 'comment_likes_enabled', 'button_style', 'sharing_label', 'show', 'twitter_site_tag', 'disable_resources' ),
			array_keys( $data )
		);
	}

	public function test_offers_reblogs_and_comment_likes_on_simple_but_not_the_resources_toggle(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertArrayHasKey( 'reblogs_enabled', $data );
		$this->assertArrayHasKey( 'comment_likes_enabled', $data );
		$this->assertArrayNotHasKey( 'disable_resources', $data );
	}

	public function test_leaves_out_the_sharing_options_while_the_sharing_module_is_off(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'likes' ) );

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertArrayHasKey( 'likes_enabled', $data );
		$this->assertArrayNotHasKey( 'button_style', $data );
		$this->assertArrayNotHasKey( 'disable_resources', $data );
	}

	public function test_reads_the_stored_values(): void {
		$this->given_both_features_running();
		update_option(
			'sharing-options',
			array(
				'global' => array(
					'button_style' => 'icon',
					'open_links'   => 'new',
					'show'         => array( 'post' ),
				),
			)
		);
		update_option( 'disabled_likes', 1 );
		update_option( Twitter_Site_Tag::OPTION, 'jetpack' );
		update_option( Sharing_Resources::OPTION, 1 );

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertFalse( $data['likes_enabled'] );
		$this->assertSame( 'icon', $data['button_style'] );
		$this->assertArrayNotHasKey( 'open_links', $data );
		$this->assertSame( array( 'post' ), $data['show'] );
		$this->assertSame( 'jetpack', $data['twitter_site_tag'] );
		$this->assertTrue( $data['disable_resources'] );
	}

	public function test_reads_the_label_decoded(): void {
		$this->given_both_features_running();
		update_option( 'sharing-options', array( 'global' => array( 'sharing_label' => 'Share &amp; enjoy' ) ) );

		$this->assertSame( 'Share & enjoy', $this->request( 'GET', 'settings' )->get_data()['sharing_label'] );
	}

	/**
	 * An absent `show` read raw would report "nowhere" on a site where the buttons are live.
	 */
	public function test_reads_the_placement_default_when_none_is_stored(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy' ) );

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertSame( array( 'post', 'page' ), $data['show'] );
	}

	public function test_saving_one_sharing_option_keeps_the_others(): void {
		$this->given_both_features_running();
		update_option(
			'sharing-options',
			array(
				'global' => array(
					'button_style' => 'icon',
					'open_links'   => 'new',
					'show'         => array( 'page' ),
				),
			)
		);

		$response = $this->request( 'POST', 'settings', array( 'sharing_label' => 'Pass it on:' ) );

		$this->assertSame( 200, $response->get_status() );

		$saved = $this->saved_global_options();

		$this->assertSame( 'Pass it on:', $saved['sharing_label'] );
		$this->assertSame( 'icon', $saved['button_style'] );
		$this->assertSame( 'new', $saved['open_links'] );
		$this->assertSame( array( 'page' ), $saved['show'] );
	}

	public function test_saving_the_label_keeps_its_backslashes(): void {
		$this->given_both_features_running();

		$this->request( 'POST', 'settings', array( 'sharing_label' => 'Back\\slash' ) );

		$this->assertSame( 'Back\\slash', stripslashes( $this->saved_global_options()['sharing_label'] ) );
	}

	public function test_saving_another_option_keeps_the_stored_label_backslashes(): void {
		$this->given_both_features_running();
		update_option( 'sharing-options', array( 'global' => array( 'sharing_label' => 'Back\\slash' ) ) );

		$this->request( 'POST', 'settings', array( 'button_style' => 'icon' ) );

		$this->assertSame( 'Back\\slash', stripslashes( $this->saved_global_options()['sharing_label'] ) );
	}

	/**
	 * `set_global_options()` stores the default label as `false`, so it follows the site language.
	 */
	public function test_saving_another_option_keeps_a_translated_default_label_the_default(): void {
		$this->given_both_features_running();
		update_option( 'sharing-options', array( 'global' => array( 'sharing_label' => false ) ) );
		$translate = function ( $translation, $text ) {
			return 'Share this:' === $text ? "Partage l'article :" : $translation;
		};
		add_filter( 'gettext', $translate, 10, 2 );

		$this->request( 'POST', 'settings', array( 'button_style' => 'icon' ) );

		remove_filter( 'gettext', $translate, 10 );
		$this->assertSame( "Partage l'article :", $this->saved_global_options()['sharing_label'] );
	}

	public function test_saving_another_option_keeps_the_likes_placement_default(): void {
		$this->given_both_features_running();
		$GLOBALS['sharing_likes_test_likes_show'] = array( 'post', 'page', 'book' );

		$this->request( 'POST', 'settings', array( 'button_style' => 'icon' ) );

		$this->assertSame( array( 'post', 'page', 'book' ), $this->saved_global_options()['show'] );
	}

	public function test_saving_writes_nothing_it_was_not_sent(): void {
		$this->given_both_features_running();
		update_option( 'disabled_likes', 1 );
		$stored = array( 'global' => array( 'button_style' => 'icon' ) );
		update_option( 'sharing-options', $stored );

		$this->request( 'POST', 'settings', array( 'twitter_site_tag' => 'jetpack' ) );

		$this->assertArrayNotHasKey( 'sharing_likes_test_global_options', $GLOBALS );
		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertSame( $stored, get_option( 'sharing-options' ) );
	}

	public function test_leaves_out_the_site_tag_while_twitter_cards_are_off(): void {
		$this->given_both_features_running();
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );

		$data     = $this->request( 'GET', 'settings' )->get_data();
		$response = $this->request( 'POST', 'settings', array( 'twitter_site_tag' => 'jetpack' ) );
		remove_filter( 'jetpack_disable_twitter_cards', '__return_true' );

		$this->assertArrayNotHasKey( 'twitter_site_tag', $data );
		$this->assertSame( 400, $response->get_status() );
		$this->assertFalse( get_option( Twitter_Site_Tag::OPTION ) );
	}

	public function test_rejects_null_rather_than_saving_it_as_off_or_empty(): void {
		$this->given_both_features_running();
		update_option( Twitter_Site_Tag::OPTION, 'jetpack' );

		$response = $this->request(
			'POST',
			'settings',
			array(
				'likes_enabled'    => null,
				'twitter_site_tag' => null,
				'show'             => null,
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertEmpty( get_option( 'disabled_likes' ) );
		$this->assertSame( 'jetpack', get_option( Twitter_Site_Tag::OPTION ) );
		$this->assertFalse( get_option( 'sharing-options' ) );
	}

	public function test_saving_turns_likes_off_and_back_on(): void {
		$this->given_both_features_running();

		$off = $this->request( 'POST', 'settings', array( 'likes_enabled' => false ) );

		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertFalse( $off->get_data()['likes_enabled'] );

		$this->request( 'POST', 'settings', array( 'likes_enabled' => true ) );

		// Reading the Likes state stores a `0` in place of an absent option, which also means "on".
		$this->assertEmpty( get_option( 'disabled_likes' ) );
	}

	public function test_saving_on_simple_writes_reblogs_and_comment_likes(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->request(
			'POST',
			'settings',
			array(
				'reblogs_enabled'       => false,
				'comment_likes_enabled' => true,
			)
		);

		$this->assertSame( '1', (string) get_option( 'disabled_reblogs' ) );
		$this->assertSame( '1', (string) get_option( 'jetpack_comment_likes_enabled' ) );
	}

	public function test_saving_placement_drops_values_outside_the_allowlist(): void {
		$this->given_both_features_running();

		$this->request( 'POST', 'settings', array( 'show' => array( 'post', 'revision', 'index' ) ) );

		$this->assertSame( array( 'post', 'index' ), get_option( 'sharing-options' )['global']['show'] );
	}

	public function test_saving_the_site_tag_drops_the_at(): void {
		$this->given_both_features_running();

		$this->request( 'POST', 'settings', array( 'twitter_site_tag' => '@jetpack' ) );

		$this->assertSame( 'jetpack', get_option( Twitter_Site_Tag::OPTION ) );
	}

	public function test_saving_the_resources_toggle(): void {
		$this->given_both_features_running();

		$this->request( 'POST', 'settings', array( 'disable_resources' => true ) );

		$this->assertSame( '1', (string) get_option( Sharing_Resources::OPTION ) );
	}

	public function test_rejects_a_whole_save_that_carries_a_setting_the_screen_does_not_show(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'likes' ) );

		$response = $this->request(
			'POST',
			'settings',
			array(
				'likes_enabled' => false,
				'button_style'  => 'icon',
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_sharing_likes_setting_unavailable', $response->get_data()['code'] );
		$this->assertEmpty( get_option( 'disabled_likes' ) );
	}

	/**
	 * Once Simple has switched Likes to the block, the section offers no way back, and neither may the API.
	 */
	public function test_rejects_turning_likes_back_on_after_simple_switched_to_the_block(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_theme();
		$this->given_block( 'jetpack/like' );
		update_option( 'disabled_likes', 1 );
		update_option( 'disabled_reblogs', 1 );

		$response = $this->request( 'POST', 'settings', array( 'likes_enabled' => true ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
	}

	public function test_offers_comment_likes_on_a_connected_site_with_no_modules(): void {
		$this->given_connection( true );

		$this->assertArrayHasKey( 'comment_likes_enabled', $this->request( 'GET', 'settings' )->get_data() );
	}

	/**
	 * Offline mode keeps a connected site's tokens, but loads no module that needs a connection.
	 */
	public function test_leaves_out_comment_likes_in_offline_mode(): void {
		$this->given_connection( true );
		$this->given_offline_mode();

		$this->assertArrayNotHasKey( 'comment_likes_enabled', $this->request( 'GET', 'settings' )->get_data() );
	}

	/**
	 * Off Simple the switch is the module, which never reads the option.
	 */
	public function test_reads_comment_likes_from_the_module_off_simple(): void {
		$this->given_connection( true );
		update_option( 'jetpack_comment_likes_enabled', 1 );

		$this->assertFalse( $this->request( 'GET', 'settings' )->get_data()['comment_likes_enabled'] );

		$this->given_modules( array( 'comment-likes' ) );

		$this->assertTrue( $this->request( 'GET', 'settings' )->get_data()['comment_likes_enabled'] );
	}

	public function test_saving_comment_likes_switches_the_module_off_simple(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'likes' ) );

		$on = $this->request( 'POST', 'settings', array( 'comment_likes_enabled' => true ) );

		$this->assertSame( 200, $on->get_status() );
		$this->assertContains( 'comment-likes', Jetpack_Options::get_option( 'active_modules' ) );
		$this->assertTrue( $on->get_data()['comment_likes_enabled'] );
		$this->assertFalse( get_option( 'jetpack_comment_likes_enabled' ) );

		$this->request( 'POST', 'settings', array( 'comment_likes_enabled' => false ) );

		$this->assertNotContains( 'comment-likes', Jetpack_Options::get_option( 'active_modules' ) );
	}

	public function test_refuses_the_whole_save_when_the_host_keeps_comment_likes_on(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'likes', 'comment-likes' ) );
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) {
				return array_merge( (array) $modules, array( 'comment-likes' ) );
			}
		);

		$response = $this->request(
			'POST',
			'settings',
			array(
				'comment_likes_enabled' => false,
				'likes_enabled'         => false,
			)
		);
		remove_all_filters( 'jetpack_active_modules' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'rest_sharing_likes_comment_likes_unchanged', $response->get_data()['code'] );
		$this->assertEmpty( get_option( 'disabled_likes' ) );
	}

	/**
	 * With Like buttons off, Comment Likes still read the sitewide default and placement, as the PHP section shows.
	 */
	public function test_offers_the_likes_settings_comment_likes_read_while_like_buttons_are_off(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'comment-likes' ) );

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertArrayHasKey( 'likes_enabled', $data );
		$this->assertArrayHasKey( 'show', $data );
	}

	public function test_leaves_out_the_likes_settings_once_nothing_reads_them(): void {
		$this->given_connection( true );

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertArrayNotHasKey( 'likes_enabled', $data );
		$this->assertArrayNotHasKey( 'show', $data );
	}

	/**
	 * Simple's Comment Likes read neither the sitewide default nor placement.
	 */
	public function test_leaves_out_likes_settings_for_comment_likes_on_simple_after_the_switch(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_theme();
		$this->given_block( 'jetpack/like' );
		$this->given_block( 'jetpack/sharing-buttons' );
		update_option( 'disabled_likes', 1 );
		update_option( 'disabled_reblogs', 1 );
		update_option(
			'sharing-services',
			array(
				'visible' => array(),
				'hidden'  => array(),
			)
		);

		$data = $this->request( 'GET', 'settings' )->get_data();

		$this->assertArrayHasKey( 'comment_likes_enabled', $data );
		$this->assertArrayNotHasKey( 'likes_enabled', $data );
		$this->assertArrayNotHasKey( 'reblogs_enabled', $data );
		$this->assertArrayNotHasKey( 'show', $data );
		$this->assertSame( 400, $this->request( 'POST', 'settings', array( 'reblogs_enabled' => true ) )->get_status() );
	}

	public function test_rejects_an_unknown_button_style(): void {
		$this->given_both_features_running();

		$response = $this->request( 'POST', 'settings', array( 'button_style' => 'sparkles' ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertArrayNotHasKey( 'sharing_likes_test_global_options', $GLOBALS );
	}
}
