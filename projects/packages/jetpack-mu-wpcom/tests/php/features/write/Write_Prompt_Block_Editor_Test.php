<?php
/**
 * Tests for the Write editor's Block-editor divert on prompt answers.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/write.php';

/**
 * Class Write_Prompt_Block_Editor_Test
 */
class Write_Prompt_Block_Editor_Test extends \WorDBless\BaseTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user ID (cannot publish posts).
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * `pagenow` as WorDBless leaves it, restored after each test.
	 *
	 * @var string
	 */
	private $original_pagenow;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		// The divert only runs on admin.php; WorDBless boots as index.php.
		$this->original_pagenow = $GLOBALS['pagenow'] ?? '';
		$GLOBALS['pagenow']     = 'admin.php';

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'wpbe_admin',
				'user_pass'  => 'password',
				'user_email' => 'wpbe_admin@example.com',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'wpbe_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'wpbe_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);

		wp_set_current_user( $this->admin_id );

		$_GET['page']          = 'write';
		$_GET['answer_prompt'] = '42';

		$_COOKIE[ WPCOM_WRITE_BLOCK_EDITOR_PREFERRED_COOKIE ] = '1';
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		Constants::set_constant( 'IS_WPCOM', false );
		wp_set_current_user( 0 );
		$GLOBALS['pagenow'] = $this->original_pagenow;

		unset( $_GET['page'], $_GET['answer_prompt'], $_GET['post'], $_GET['url'], $_GET['source'] );
		unset( $_COOKIE[ WPCOM_WRITE_BLOCK_EDITOR_PREFERRED_COOKIE ] );

		parent::tear_down();
	}

	/**
	 * The case this exists for: a prompt card on wordpress.com can't read the
	 * cookie, so an opted-out writer arrives at Write and has to be handed on.
	 */
	public function test_opted_out_prompt_answer_goes_to_the_block_editor() {
		$this->assertSame(
			admin_url( 'post-new.php?answer_prompt=42' ),
			wpcom_write_prompt_block_editor_url()
		);
	}

	/**
	 * Simple has no editor script to seed the prompt into post-new.php.
	 */
	public function test_opted_out_prompt_answer_on_simple_goes_to_calypso() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertSame(
			'https://wordpress.com/post/1?answer_prompt=42',
			wpcom_write_prompt_block_editor_url()
		);
	}

	/**
	 * No cookie, no divert.
	 */
	public function test_no_cookie_leaves_the_arrival_on_write() {
		unset( $_COOKIE[ WPCOM_WRITE_BLOCK_EDITOR_PREFERRED_COOKIE ] );

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * Only the value view.js writes counts, so all three readers agree.
	 */
	public function test_cookie_with_another_value_is_not_an_opt_out() {
		$_COOKIE[ WPCOM_WRITE_BLOCK_EDITOR_PREFERRED_COOKIE ] = 'yes';

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * The opt-out is about prompts, so the Reader's Write button and the
	 * /write-editor picker — neither carrying one — are left alone.
	 */
	public function test_arrival_without_a_prompt_is_left_alone() {
		unset( $_GET['answer_prompt'] );

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * Diverting would drop the writer into a blank new post instead of their draft.
	 */
	public function test_editing_an_existing_post_is_never_diverted() {
		$_GET['post'] = '123';

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * Same reasoning for the ?url= form of "open this existing post".
	 */
	public function test_opening_a_post_by_url_is_never_diverted() {
		$_GET['url'] = 'https://example.com/?p=123';

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * A negative id would otherwise reach post-new.php as a different prompt.
	 */
	public function test_non_numeric_prompt_id_is_not_diverted() {
		$_GET['answer_prompt'] = 'not-an-id';

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * Only ?page=write is considered.
	 */
	public function test_other_admin_pages_are_untouched() {
		$_GET['page'] = 'not-write';

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * Someone who can't publish meets Write's own refusal rather than post-new.php's.
	 */
	public function test_user_who_cannot_publish_is_not_diverted() {
		wp_set_current_user( $this->subscriber_id );

		$this->assertSame( '', wpcom_write_prompt_block_editor_url() );
	}

	/**
	 * The divert is only reachable because it is hooked; nothing else asserts that.
	 */
	public function test_divert_is_registered_on_admin_init() {
		$this->assertNotFalse(
			has_action( 'admin_init', 'wpcom_write_divert_prompt_to_block_editor' )
		);
	}

	/**
	 * Simple's destination is off-host, so it only survives while
	 * wp_safe_redirect() is told to allow wordpress.com.
	 */
	public function test_simple_divert_survives_safe_redirect_validation() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertSame(
			'https://wordpress.com/post/1?answer_prompt=42',
			$this->capture_redirect()
		);
	}

	/**
	 * Atomic and self-hosted stay on the same host.
	 */
	public function test_divert_redirects_to_post_new_off_simple() {
		$this->assertSame( admin_url( 'post-new.php?answer_prompt=42' ), $this->capture_redirect() );
	}

	/**
	 * The `admin_init` hook also fires on admin-ajax.php and admin-post.php,
	 * where a redirect would replace the response body.
	 */
	public function test_divert_does_not_run_outside_admin_php() {
		$GLOBALS['pagenow'] = 'admin-post.php';

		$this->assertSame( '', $this->capture_redirect() );
	}

	/**
	 * Runs the hooked divert and returns where it sent the browser, unwinding
	 * from the `wp_redirect` filter so the function's `exit` is never reached.
	 *
	 * @return string Redirect target, or '' when the divert declined to run.
	 */
	private function capture_redirect() {
		$capture = function ( $location ) {
			throw new \RuntimeException( (string) $location );
		};

		add_filter( 'wp_redirect', $capture );
		try {
			wpcom_write_divert_prompt_to_block_editor();
			$location = '';
		} catch ( \RuntimeException $e ) {
			$location = $e->getMessage();
		} finally {
			remove_filter( 'wp_redirect', $capture );
		}

		return $location;
	}
}
