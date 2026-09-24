<?php
/**
 * Tests for the Settings > Sharing form handling.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionMethod;
use RuntimeException;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings\Post_Handler
 */
#[CoversClass( Post_Handler::class )]
class Post_Handler_Test extends BaseTestCase {

	use Section_Environment;

	/**
	 * Where `maybe_handle()` sent the browser, or null if it never got that far.
	 *
	 * @var string|null
	 */
	private $redirected_to = null;

	/**
	 * Start every case from a site with no theme, no blocks and no modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
	}

	/**
	 * Leave no request state or options behind.
	 */
	public function tear_down() {
		$_POST    = array();
		$_GET     = array();
		$_REQUEST = array();

		$this->redirected_to = null;
		remove_all_filters( 'wp_redirect' );

		delete_option( 'sharing-options' );
		delete_option( 'disabled_likes' );
		delete_option( 'disabled_reblogs' );
		delete_option( 'jetpack_comment_likes_enabled' );
		delete_option( 'sharing-services' );
		delete_option( Twitter_Site_Tag::OPTION );
		delete_option( Sharing_Resources::OPTION );
		$this->tear_down_site();
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Post a payload as a signed submission of one section's form.
	 *
	 * @param string              $nonce_action Nonce action the section uses.
	 * @param array<string,mixed> $payload      Fields the form submits.
	 */
	private function submit( string $nonce_action, array $payload ): void {
		$_POST             = $payload;
		$_POST['_wpnonce'] = wp_create_nonce( $nonce_action );
		$_REQUEST          = $_POST;
	}

	/**
	 * A payload claiming the given sections, as the form's hidden fields do.
	 *
	 * @param string[]            $sections Sections the form claims.
	 * @param array<string,mixed> $payload  Other fields the form submits.
	 * @return array<string,mixed>
	 */
	private function claiming( array $sections, array $payload = array() ): array {
		$payload[ Settings_Form::SECTIONS_FIELD ] = $sections;

		return $payload;
	}

	/**
	 * Run one of the private save handlers, which return rather than redirect.
	 *
	 * @param string $method Method name.
	 */
	private function save( string $method ): void {
		$handler = new ReflectionMethod( Post_Handler::class, $method );
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only needed on older versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$handler->setAccessible( true );
		}
		$handler->invoke( null );
	}

	/**
	 * Record the redirect and escape, since `maybe_handle()` follows it with `exit`.
	 *
	 * @param string $location Where the handler is sending the browser.
	 * @return never
	 * @throws RuntimeException Always.
	 */
	public function stop_at_redirect( $location ) {
		$this->redirected_to = $location;

		throw new RuntimeException( 'redirected' );
	}

	/**
	 * Drive a request through the public entry point.
	 *
	 * @param string              $action       Value of the action field.
	 * @param string              $nonce_action Nonce action the section uses.
	 * @param array<string,mixed> $payload      Other fields the form submits.
	 * @return bool Whether the handler redirected.
	 */
	private function dispatch( string $action, string $nonce_action, array $payload = array() ): bool {
		$_GET['page'] = Settings_Page::SLUG;

		$payload['jetpack_sharing_action'] = $action;
		$this->submit( $nonce_action, $payload );

		add_filter( 'wp_redirect', array( $this, 'stop_at_redirect' ) );

		try {
			Post_Handler::maybe_handle();
		} catch ( RuntimeException $e ) {
			return true;
		}

		return false;
	}

	/**
	 * An administrator, which is what the handler's capability check wants.
	 */
	private function log_in_as( string $role ): void {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sharing_handler_' . $role,
				'user_pass'  => 'password',
				'user_email' => $role . '@example.com',
				'role'       => $role,
			)
		);

		$this->assertIsInt( $user_id );

		wp_set_current_user( $user_id );
	}

	/**
	 * The checkboxes are the whole of the setting, so the posted list replaces
	 * whatever was stored.
	 */
	public function test_placement_save_stores_the_posted_post_types(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'page' ) ) ) );

		$this->submit( Settings_Form::NONCE_ACTION, array( 'show' => array( 'post', 'index' ) ) );
		$this->save( 'save_placement' );

		$options = get_option( 'sharing-options' );

		$this->assertSame( array( 'post', 'index' ), $options['global']['show'] );
	}

	/**
	 * Unchecking every box means "nowhere", not "leave it alone". The handler
	 * this replaces kept the stored value in that case, which made the empty
	 * state unreachable from the screen.
	 */
	public function test_placement_save_can_clear_every_post_type(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'post', 'page' ) ) ) );

		$this->submit( Settings_Form::NONCE_ACTION, array() );
		$this->save( 'save_placement' );

		$options = get_option( 'sharing-options' );

		$this->assertSame( array(), $options['global']['show'] );
	}

	/**
	 * Anything that is not a public post type is dropped, so a crafted payload
	 * cannot widen where the buttons render.
	 */
	public function test_placement_save_drops_values_outside_the_allowlist(): void {
		$this->submit(
			Settings_Form::NONCE_ACTION,
			array( 'show' => array( 'post', 'revision', 'not-a-post-type', array( 'nested' ) ) )
		);
		$this->save( 'save_placement' );

		$options = get_option( 'sharing-options' );

		$this->assertSame( array( 'post' ), $options['global']['show'] );
	}

	/**
	 * Saving placement must not disturb the rest of the sharing options, which
	 * are edited from a different form.
	 */
	public function test_placement_save_leaves_the_other_global_options_alone(): void {
		update_option(
			'sharing-options',
			array(
				'global' => array(
					'button_style'  => 'icon',
					'sharing_label' => 'Pass it on:',
					'show'          => array( 'page' ),
				),
			)
		);

		$this->submit( Settings_Form::NONCE_ACTION, array( 'show' => array( 'post' ) ) );
		$this->save( 'save_placement' );

		$options = get_option( 'sharing-options' );

		$this->assertSame( 'icon', $options['global']['button_style'] );
		$this->assertSame( 'Pass it on:', $options['global']['sharing_label'] );
	}

	/**
	 * Sites carry a malformed `global` (#6121), which every read path in the
	 * repo guards against. Writing into it in place fatals on PHP 8 where the
	 * services save, which rebuilds the array wholesale, survives.
	 */
	public function test_placement_save_survives_a_malformed_global(): void {
		update_option( 'sharing-options', array( 'global' => 'corrupt' ) );

		$this->submit( Settings_Form::NONCE_ACTION, array( 'show' => array( 'post' ) ) );
		$this->save( 'save_placement' );

		$options = get_option( 'sharing-options' );

		$this->assertSame( array( 'post' ), $options['global']['show'] );
	}

	/**
	 * `disabled_likes` is the absence of an option, not a falsy one: the Likes
	 * code paths test it with `get_option()` alone.
	 */
	public function test_likes_save_turns_site_wide_likes_off_and_back_on(): void {
		$this->submit( Likes_Section::NONCE_ACTION, array( 'wpl_default' => 'off' ) );
		$this->save( 'save_likes' );

		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );

		$this->submit( Likes_Section::NONCE_ACTION, array( 'wpl_default' => 'on' ) );
		$this->save( 'save_likes' );

		$this->assertFalse( get_option( 'disabled_likes' ) );
	}

	/**
	 * The capability check is the screen's only gate on who may write these
	 * options: the nonce proves the request came from a form, not that the
	 * person submitting it is allowed to change site settings.
	 */
	public function test_dispatch_ignores_a_user_without_manage_options(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'post', 'page' ) ) ) );
		$this->log_in_as( 'editor' );

		$redirected = $this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_PLACEMENT ), array( 'show' => array( 'index' ) ) ) );

		$options = get_option( 'sharing-options' );

		$this->assertFalse( $redirected );
		$this->assertSame( array( 'post', 'page' ), $options['global']['show'] );
	}

	/**
	 * The handler runs on every `admin_init`, so it has to leave requests to
	 * other screens alone rather than reading their payloads as its own.
	 */
	public function test_dispatch_ignores_a_submission_from_another_screen(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'post', 'page' ) ) ) );
		$this->log_in_as( 'administrator' );

		$_GET['page'] = 'some-other-screen';
		$this->submit(
			Settings_Form::NONCE_ACTION,
			array(
				'jetpack_sharing_action' => 'save-settings',
				'show'                   => array( 'index' ),
			)
		);

		Post_Handler::maybe_handle();

		$options = get_option( 'sharing-options' );

		$this->assertSame( array( 'post', 'page' ), $options['global']['show'] );
	}

	/**
	 * An action the switch does not name must fall through to no redirect, so a
	 * stray payload cannot leave the browser on a "saved" screen.
	 */
	public function test_dispatch_ignores_an_unknown_action(): void {
		$this->log_in_as( 'administrator' );

		$redirected = $this->dispatch( 'save-everything', Settings_Form::NONCE_ACTION );

		$this->assertFalse( $redirected );
		$this->assertNull( $this->redirected_to );
	}

	/**
	 * Each claimed section has to reach its own save. Routing Likes to any of
	 * the others would write nothing and still report a save.
	 */
	public function test_save_routes_the_likes_section_to_the_likes_save(): void {
		$this->log_in_as( 'administrator' );

		$redirected = $this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_LIKES ), array( 'wpl_default' => 'off' ) ) );

		$this->assertTrue( $redirected );
		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
	}

	/**
	 * A save sends the browser back with the flag the screen prints its
	 * confirmation from, on the screen's own slug.
	 */
	public function test_dispatch_returns_to_the_screen_with_the_saved_flag(): void {
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_PLACEMENT ), array( 'show' => array( 'post' ) ) ) );

		$this->assertSame(
			admin_url( 'options-general.php?page=sharing&update=saved' ),
			$this->redirected_to
		);
	}

	/**
	 * Switching a module back on is not a save, and saying it was would print a
	 * confirmation for settings the request never touched.
	 */
	public function test_dispatch_returns_without_the_saved_flag_after_an_activation(): void {
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'activate-likes', Likes_Section::NONCE_ACTION );

		$this->assertSame(
			admin_url( 'options-general.php?page=sharing' ),
			$this->redirected_to
		);
	}

	/**
	 * A radio group posts nothing when the browser suppresses it, and the Likes
	 * radio defaults to on. Reading an absent field as "off" would turn Likes
	 * off site-wide on a save of some neighbouring setting.
	 */
	public function test_likes_save_leaves_likes_on_when_the_radio_is_not_posted(): void {
		update_option( 'disabled_likes', 1 );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_LIKES ) ) );

		$this->assertFalse( get_option( 'disabled_likes' ) );
	}

	/**
	 * Reblogs and comment likes are Simple-only fields. Writing them from a
	 * Jetpack save would persist settings the screen never rendered.
	 */
	public function test_likes_save_ignores_the_simple_only_fields_off_wpcom(): void {
		$this->log_in_as( 'administrator' );

		$this->dispatch(
			'save-settings',
			Settings_Form::NONCE_ACTION,
			$this->claiming(
				array( Settings_Form::SECTION_LIKES ),
				array(
					'wpl_default'                   => 'on',
					'jetpack_reblogs_enabled'       => 'off',
					'jetpack_comment_likes_enabled' => '1',
				)
			)
		);

		$this->assertFalse( get_option( 'disabled_reblogs' ) );
		$this->assertFalse( get_option( 'jetpack_comment_likes_enabled' ) );
	}

	/**
	 * A Simple site whose post Likes moved to the block keeps only this checkbox,
	 * so saving it must not bring the legacy buttons back.
	 */
	public function test_comment_likes_save_leaves_the_switched_off_buttons_alone(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		update_option( 'disabled_likes', 1 );
		update_option( 'disabled_reblogs', 1 );
		$this->log_in_as( 'administrator' );

		$redirected = $this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_COMMENT_LIKES ), array( 'jetpack_comment_likes_enabled' => '1' ) ) );

		$this->assertTrue( $redirected );
		$this->assertSame( '1', (string) get_option( 'jetpack_comment_likes_enabled' ) );
		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertSame( '1', (string) get_option( 'disabled_reblogs' ) );
	}

	public function test_comment_likes_save_writes_nothing_off_wpcom(): void {
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_COMMENT_LIKES ), array( 'jetpack_comment_likes_enabled' => '1' ) ) );

		$this->assertFalse( get_option( 'jetpack_comment_likes_enabled' ) );
	}

	/**
	 * Count `sharing_admin_update` over one save claiming the given sections.
	 *
	 * @param string[] $sections Sections the form claims.
	 */
	private function count_admin_updates( array $sections ): int {
		$fired = 0;
		add_action(
			'sharing_admin_update',
			function () use ( &$fired ) {
				++$fired;
			}
		);
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( $sections ) );

		remove_all_actions( 'sharing_admin_update' );

		return $fired;
	}

	/**
	 * Third parties render into the extras section and save through this hook,
	 * verifying their own nonces. Without it their fields post to nothing.
	 */
	public function test_extras_save_fires_the_hook_third_parties_save_from(): void {
		$this->assertSame( 1, $this->count_admin_updates( array( Settings_Form::SECTION_EXTRAS ) ) );
	}

	/**
	 * Its consumers save from whatever they rendered, and a second pass would save twice.
	 */
	public function test_save_fires_the_third_party_hook_once_for_both_hosts(): void {
		$this->assertSame( 1, $this->count_admin_updates( array( Settings_Form::SECTION_SHARING, Settings_Form::SECTION_EXTRAS ) ) );
	}

	/**
	 * With neither host on the screen, no third-party field was either, and
	 * sharedaddy's consumer would reset its setting from the missing checkbox.
	 */
	public function test_save_leaves_the_third_party_hook_alone_when_no_host_rendered(): void {
		$this->assertSame( 0, $this->count_admin_updates( array( Settings_Form::SECTION_LIKES, Settings_Form::SECTION_PLACEMENT ) ) );
	}

	/**
	 * The screen saves its own rows in the extras section, under its own nonce,
	 * and leaves out any it did not render there.
	 */
	public function test_extras_save_stores_the_site_tag_and_leaves_the_legacy_resources_alone(): void {
		update_option( Sharing_Resources::OPTION, 1 );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_EXTRAS ), array( Twitter_Site_Tag::OPTION => '@jetpack' ) ) );

		$this->assertSame( 'jetpack', get_option( Twitter_Site_Tag::OPTION ) );
		$this->assertSame( 1, get_option( Sharing_Resources::OPTION ) );
	}

	/**
	 * "Disable CSS and JS" renders with the services list, so the services
	 * section's save is its only route now that sharedaddy stopped saving it.
	 */
	public function test_sharing_save_stores_the_legacy_resources_checkbox(): void {
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy' ) );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_SHARING ), array( 'disable_resources' => 'on' ) ) );

		$this->assertSame( 1, get_option( Sharing_Resources::OPTION ) );
	}

	/**
	 * A form built while the services list was hidden carries no checkbox, so a
	 * service added in the meantime must not turn the reading of its absence into an "off".
	 */
	public function test_extras_save_leaves_the_legacy_resources_alone_once_sharing_configures(): void {
		update_option( Sharing_Resources::OPTION, 1 );
		$this->given_connection( true );
		$this->given_modules( array( 'sharedaddy' ) );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_EXTRAS ) ) );

		$this->assertSame( 1, get_option( Sharing_Resources::OPTION ) );
	}

	/**
	 * Neither host rendered, so the Site Tag field was not on the screen either.
	 */
	public function test_save_leaves_the_site_tag_alone_when_no_host_rendered(): void {
		update_option( Twitter_Site_Tag::OPTION, 'jetpack' );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_LIKES ) ) );

		$this->assertSame( 'jetpack', get_option( Twitter_Site_Tag::OPTION ) );
	}

	/**
	 * The point of one form: edits in several sections land in one save.
	 */
	public function test_save_stores_every_claimed_section_at_once(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'page' ) ) ) );
		$this->log_in_as( 'administrator' );

		$this->dispatch(
			'save-settings',
			Settings_Form::NONCE_ACTION,
			$this->claiming(
				array( Settings_Form::SECTION_LIKES, Settings_Form::SECTION_PLACEMENT ),
				array(
					'wpl_default' => 'off',
					'show'        => array( 'post' ),
				)
			)
		);

		$options = get_option( 'sharing-options' );

		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertSame( array( 'post' ), $options['global']['show'] );
	}

	/**
	 * An unclaimed section's fields were not on the screen. Reading the absent
	 * Likes radio as its "on" default would turn Likes back on for every post.
	 */
	public function test_save_leaves_unclaimed_sections_alone(): void {
		update_option( 'disabled_likes', 1 );
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'page' ) ) ) );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_EXTRAS ) ) );

		$options = get_option( 'sharing-options' );

		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertSame( array( 'page' ), $options['global']['show'] );
	}

	/**
	 * The services settings rebuild the global options from defaults, so they
	 * have to save first and carry placement through, or placement is lost.
	 */
	public function test_sharing_save_hands_placement_through(): void {
		update_option( 'sharing-options', array( 'global' => array( 'show' => array( 'page' ) ) ) );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'save-settings', Settings_Form::NONCE_ACTION, $this->claiming( array( Settings_Form::SECTION_SHARING ), array( 'button_style' => 'icon' ) ) );

		$saved = $GLOBALS['sharing_likes_test_global_options'];
		unset( $GLOBALS['sharing_likes_test_global_options'] );

		$this->assertSame( 'icon', $saved['button_style'] );
		$this->assertSame( array( 'page' ), $saved['show'] );
	}

	/**
	 * A request can name sections the screen never renders; they must not reach a save.
	 */
	public function test_posted_sections_are_checked_against_the_known_ones(): void {
		$this->submit( Settings_Form::NONCE_ACTION, array( Settings_Form::SECTIONS_FIELD => array( 'likes', 'everything', array( 'placement' ) ) ) );

		$this->assertSame( array( Settings_Form::SECTION_LIKES ), Settings_Form::posted_sections() );
	}

	/**
	 * Report the module slugs as available, so `Modules` does not filter them
	 * out of the active list for want of a plugin to read module headers from.
	 *
	 * @return string[]
	 */
	public function offer_modules(): array {
		return array( 'sharedaddy', 'likes', 'comment-likes' );
	}

	/**
	 * "Switch to the … block" is a single unconfirmed click that stops the
	 * feature producing output, so it has to stop the right one.
	 */
	public function test_switch_to_block_turns_off_only_the_submitting_feature(): void {
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		\Jetpack_Options::update_option( 'active_modules', array( 'sharedaddy', 'likes' ) );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'switch-to-block-likes', Likes_Section::NONCE_ACTION );

		$active = \Jetpack_Options::get_option( 'active_modules' );

		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		\Jetpack_Options::delete_option( 'active_modules' );

		$this->assertSame( array( 'sharedaddy' ), array_values( $active ) );
	}

	/**
	 * Simple has no module to deactivate, so the switch has to stop the output
	 * through the setting sharedaddy reads there instead.
	 */
	public function test_switch_to_block_sharing_on_simple_removes_every_service(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		update_option(
			'sharing-services',
			array(
				'visible' => array( 'facebook' ),
				'hidden'  => array( 'x' ),
			)
		);
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'switch-to-block-sharing', Sharing_Section::NONCE_ACTION );

		$this->assertSame(
			array(
				'visible' => array(),
				'hidden'  => array(),
			),
			get_option( 'sharing-services' )
		);
		$this->assertFalse( get_option( 'disabled_likes' ) );
	}

	/**
	 * The legacy widget renders for a Reblog button alone, so switching Likes
	 * off without Reblogs would leave it on every post.
	 */
	public function test_switch_to_block_likes_on_simple_turns_off_likes_and_reblogs(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->log_in_as( 'administrator' );

		$this->dispatch( 'switch-to-block-likes', Likes_Section::NONCE_ACTION );

		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertSame( '1', (string) get_option( 'disabled_reblogs' ) );
		$this->assertFalse( get_option( 'sharing-services' ) );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public static function provide_section_nonce_actions(): array {
		return array(
			'sharing'  => array( Sharing_Section::NONCE_ACTION ),
			'likes'    => array( Likes_Section::NONCE_ACTION ),
			'settings' => array( Settings_Form::NONCE_ACTION ),
		);
	}

	/**
	 * `sharing-options` is the one nonce the screen must never sign with:
	 * `Services_Config::process_requests()` answers to it and rebuilds the
	 * global options from defaults, clearing placement on the way.
	 *
	 * @param string $nonce_action The section's nonce action.
	 * @dataProvider provide_section_nonce_actions
	 */
	#[DataProvider( 'provide_section_nonce_actions' )]
	public function test_sections_do_not_reuse_the_sharedaddy_nonce( string $nonce_action ): void {
		$this->assertNotSame( 'sharing-options', $nonce_action );
	}
}
