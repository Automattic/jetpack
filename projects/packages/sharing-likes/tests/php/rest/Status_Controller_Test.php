<?php
/**
 * Tests for the status and action routes.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Block_Names;
use Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Hooked_Blocks;
use Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Template_Placements;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_Environment;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_State;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Block_Template;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/class-jetpack-likes-settings.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';
require_once __DIR__ . '/../lib/trait-rest-requests.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\REST\Status_Controller
 */
#[CoversClass( Status_Controller::class )]
class Status_Controller_Test extends BaseTestCase {

	use Section_Environment;
	use REST_Requests;

	/**
	 * Start every case as an administrator on a connected site with no theme, blocks or modules.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
		$this->set_up_rest();
		$this->given_connection( true );
		$this->log_in_as( 'administrator' );
	}

	/**
	 * Leave no options or constants behind.
	 */
	public function tear_down() {
		foreach ( array_merge( array( 'sharing-services', 'disabled_likes', 'disabled_reblogs' ), Template_Placements::OPTIONS ) as $option ) {
			delete_option( $option );
		}

		remove_all_filters( 'get_block_template' );
		remove_all_filters( 'pre_get_block_template' );
		remove_all_filters( 'hooked_block_types' );
		remove_all_filters( 'hooked_block_' . Block_Names::SHARING_BUTTONS );
		remove_all_filters( 'hooked_block_' . Block_Names::LIKE );
		$this->tear_down_rest();
		$this->tear_down_site();
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * A block theme with both blocks, so each section can offer the block route.
	 */
	private function given_block_routes(): void {
		$this->given_block_theme();
		$this->given_block( Block_Names::SHARING_BUTTONS );
		$this->given_block( Block_Names::LIKE );
	}

	/**
	 * Active module slugs, in order.
	 *
	 * @return string[]
	 */
	private function active_modules(): array {
		return array_values( (array) Jetpack_Options::get_option( 'active_modules', array() ) );
	}

	public function test_status_reports_what_each_section_renders(): void {
		$this->given_modules( array( 'sharedaddy' ) );

		$data = $this->request( 'GET', 'status' )->get_data();

		$this->assertSame( Section_State::CONFIGURE, $data['sharing']['state'] );
		$this->assertSame( Section_State::OFF, $data['likes']['state'] );
		$this->assertTrue( $data['likes']['supported'] );
		$this->assertTrue( $data['placement'] );
		$this->assertSame( '', $data['site_editor_url'] );
	}

	public function test_status_reports_likes_unsupported_in_offline_mode(): void {
		$this->given_offline_mode();

		$this->assertFalse( $this->request( 'GET', 'status' )->get_data()['likes']['supported'] );
	}

	/**
	 * Off Simple, Comment Likes read the Likes settings, so they keep placement on screen with both button features off.
	 */
	public function test_status_reports_comment_likes_that_follow_the_likes_settings(): void {
		$this->given_modules( array( 'comment-likes' ) );

		$data = $this->request( 'GET', 'status' )->get_data();

		$this->assertTrue( $data['comment_likes']['supported'] );
		$this->assertTrue( $data['comment_likes']['follows_likes_settings'] );
		$this->assertTrue( $data['placement'] );
	}

	public function test_status_reports_comment_likes_on_simple_as_independent_of_the_likes_settings(): void {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertFalse( $this->request( 'GET', 'status' )->get_data()['comment_likes']['follows_likes_settings'] );
	}

	public function test_status_hides_placement_once_nothing_reads_it(): void {
		$this->given_modules( array() );

		$this->assertFalse( $this->request( 'GET', 'status' )->get_data()['placement'] );
	}

	public function test_status_links_the_single_template_where_the_block_is_a_route(): void {
		$this->given_block_routes();

		$this->assertStringContainsString( 'site-editor.php', $this->request( 'GET', 'status' )->get_data()['site_editor_url'] );
	}

	/**
	 * A link reusing the single template's lookup would send "change pages on their own" to the post template,
	 * and one built without checking would 404 on a theme with no `page` template.
	 *
	 * @dataProvider provide_page_templates
	 *
	 * @param string $site     `block_theme` or `no_page_template`.
	 * @param string $expected Query string of the link, or empty for none.
	 */
	#[DataProvider( 'provide_page_templates' )]
	public function test_status_links_the_page_template_where_the_theme_has_one( string $site, string $expected ): void {
		$this->given_block_routes();
		if ( 'no_page_template' === $site ) {
			add_filter(
				'get_block_template',
				static function ( $template, string $id ) {
					return '//page' === substr( $id, -6 ) ? null : $template;
				},
				10,
				2
			);
		}

		$data = $this->request( 'GET', 'status' )->get_data();

		$this->assertSame( '' === $expected ? '' : admin_url( 'site-editor.php' ) . $expected, $data['page_template_editor_url'] );
		$this->assertStringContainsString( '%2F%2Fsingle', $data['site_editor_url'], 'The single template link follows its own template.' );
	}

	/**
	 * Sites with and without a page template.
	 *
	 * @return array<string, array{string, string}>
	 */
	public static function provide_page_templates(): array {
		return array(
			'the fixture theme ships page.html' => array( 'block_theme', '?p=%2Fwp_template%2Fblock-theme%2F%2Fpage&canvas=edit' ),
			'a block theme without page.html'   => array( 'no_page_template', '' ),
		);
	}

	/**
	 * Save a template in the Site Editor, as core stores it: a post the template then points at,
	 * whose content `get_block_template()` returns with the blocks already hooked in.
	 *
	 * @param string $slug    Template slug.
	 * @param string $content Saved content.
	 */
	private function given_saved_template( string $slug, string $content ): void {
		$template          = new WP_Block_Template();
		$template->slug    = $slug;
		$template->content = $content . '<!-- wp:jetpack/sharing-buttons /--><!-- wp:jetpack/like /-->';
		$template->wp_id   = wp_insert_post(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => $slug,
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);

		add_filter(
			'pre_get_block_template',
			static function ( $found, string $id ) use ( $template, $slug ) {
				return get_stylesheet() . '//' . $slug === $id ? $template : $found;
			},
			10,
			2
		);
	}

	/**
	 * @return array<string, array{0: array<string, string>, 1: string[], 2: string[]}>
	 */
	public static function provide_saved_templates(): array {
		$ignoring = '<!-- wp:post-content {"metadata":{"ignoredHookedBlocks":["' . Block_Names::SHARING_BUTTONS . '"]}} /-->';

		return array(
			'none saved'                       => array( array(), array(), array() ),
			'both saved before either applied' => array(
				array(
					'single' => '<!-- wp:post-content /-->',
					'page'   => '<!-- wp:post-content /-->',
				),
				array(),
				array(),
			),
			'each managing one block'          => array(
				array(
					'single' => $ignoring,
					'page'   => '<!-- wp:post-content /--><!-- wp:jetpack/like /-->',
				),
				array( 'single' ),
				array( 'page' ),
			),
			'both managing sharing'            => array(
				array(
					'single' => $ignoring,
					'page'   => $ignoring,
				),
				array( 'single', 'page' ),
				array(),
			),
		);
	}

	/**
	 * @dataProvider provide_saved_templates
	 *
	 * @param array<string, string> $saved   Saved content by template slug.
	 * @param string[]              $sharing Templates managing the Sharing Buttons block.
	 * @param string[]              $likes   Templates managing the Like block.
	 */
	#[DataProvider( 'provide_saved_templates' )]
	public function test_status_lists_the_saved_templates_that_manage_each_block( array $saved, array $sharing, array $likes ): void {
		$this->given_block_routes();
		$this->given_modules( array( 'blocks' ) );
		Template_Placements::update( Template_Placements::FEATURE_SHARING, array( Template_Placements::AFTER_CONTENT ) );
		Template_Placements::update( Template_Placements::FEATURE_LIKES, array( Template_Placements::AFTER_CONTENT ) );
		Hooked_Blocks::init();
		foreach ( $saved as $slug => $content ) {
			$this->given_saved_template( $slug, $content );
		}

		$data = $this->request( 'GET', 'status' )->get_data();

		$this->assertSame( $sharing, $data['sharing']['managed_templates'] );
		$this->assertSame( $likes, $data['likes']['managed_templates'] );
	}

	/**
	 * Each lookup builds the template with block hooks applied, so the editor links and the saved content share one.
	 */
	public function test_status_looks_each_template_up_once(): void {
		$this->given_block_routes();
		$looked_up = array();
		add_filter(
			'pre_get_block_template',
			static function ( $found, string $id ) use ( &$looked_up ) {
				$looked_up[] = $id;
				return $found;
			},
			10,
			2
		);

		$this->request( 'GET', 'status' );

		$this->assertSame( array( 'block-theme//single', 'block-theme//page' ), array_values( array_unique( $looked_up ) ) );
		$this->assertCount( 2, $looked_up );
	}

	public function test_status_skips_the_templates_where_no_section_offers_the_placements(): void {
		$this->given_block_routes();
		$this->given_modules( array( 'sharedaddy', 'likes' ) );
		$this->given_saved_template( 'single', '<!-- wp:post-content /--><!-- wp:jetpack/sharing-buttons /--><!-- wp:jetpack/like /-->' );

		$data = $this->request( 'GET', 'status' )->get_data();

		$this->assertSame( array(), $data['sharing']['managed_templates'] );
		$this->assertSame( array(), $data['likes']['managed_templates'] );
	}

	public function test_switching_to_the_block_turns_off_only_that_feature(): void {
		$this->given_block_routes();
		$this->given_modules( array( 'sharedaddy', 'likes' ) );

		$response = $this->request( 'POST', 'sharing/switch-to-block' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'likes' ), $this->active_modules() );
		$this->assertSame( Section_State::BLOCK_CALL_TO_ACTION, $response->get_data()['sharing']['state'] );
	}

	public function test_switching_likes_to_the_block_on_simple_turns_off_likes_and_reblogs(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_routes();

		$response = $this->request( 'POST', 'likes/switch-to-block' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertSame( '1', (string) get_option( 'disabled_reblogs' ) );
		$this->assertSame( Section_State::BLOCK_CALL_TO_ACTION, $response->get_data()['likes']['state'] );
	}

	public function test_switching_sharing_to_the_block_on_simple_empties_the_services_through_sharing_service(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_routes();
		$GLOBALS['sharing_likes_test_services'] = array( 'x' );
		update_option(
			'sharing-services',
			array(
				'visible' => array( 'x' ),
				'hidden'  => array(),
			)
		);
		$announced = did_action( 'sharing_get_services_state' );

		$response = $this->request( 'POST', 'sharing/switch-to-block' );
		unset( $GLOBALS['sharing_likes_test_services'] );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $announced + 1, did_action( 'sharing_get_services_state' ) );
		$this->assertSame(
			array(
				'visible' => array(),
				'hidden'  => array(),
			),
			get_option( 'sharing-services' )
		);
		$this->assertSame( Section_State::BLOCK_CALL_TO_ACTION, $response->get_data()['sharing']['state'] );
	}

	/**
	 * Only the sharing section offers the switch here, so nothing may reach the likes one.
	 */
	public function test_the_feature_comes_from_the_url_alone(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->given_block_theme();
		$this->given_block( Block_Names::SHARING_BUTTONS );

		$this->assertSame( 400, $this->request( 'POST', 'SHARING/switch-to-block' )->get_status() );
		$this->assertSame( 400, $this->request( 'POST', 'sharing/switch-to-block', array( 'feature' => 'bogus' ) )->get_status() );
		$this->assertSame( 400, $this->request( 'POST', 'sharing/activate', array( 'feature' => array( 'sharing' ) ) )->get_status() );

		$this->request( 'POST', 'sharing/switch-to-block', array( 'feature' => 'likes' ) );

		$this->assertNotSame( '1', (string) get_option( 'disabled_likes' ) );
		$this->assertNotSame( '1', (string) get_option( 'disabled_reblogs' ) );
	}

	/**
	 * Without a block to move to, the legacy options are the only way to configure the feature.
	 */
	public function test_switching_to_the_block_is_refused_without_a_block_route(): void {
		$this->given_modules( array( 'sharedaddy' ) );

		$response = $this->request( 'POST', 'sharing/switch-to-block' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( array( 'sharedaddy' ), $this->active_modules() );
	}

	public function test_turning_a_feature_on_from_off(): void {
		$this->given_modules( array() );

		$response = $this->request( 'POST', 'sharing/activate' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'sharedaddy' ), $this->active_modules() );
		$this->assertSame( Section_State::CONFIGURE, $response->get_data()['sharing']['state'] );
	}

	/**
	 * The Jetpack dashboard drops its module toggle on these sites, so the API must not add one back.
	 */
	public function test_turning_a_feature_on_is_refused_where_the_block_is_the_route(): void {
		$this->given_block_routes();
		$this->given_modules( array() );

		$response = $this->request( 'POST', 'likes/activate' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( array(), $this->active_modules() );
	}

	public function test_likes_actions_are_refused_in_offline_mode(): void {
		$this->given_offline_mode();
		$this->given_modules( array() );

		$response = $this->request( 'POST', 'likes/activate' );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'rest_sharing_likes_action_unavailable', $response->get_data()['code'] );
		$this->assertSame( array(), $this->active_modules() );
	}

	public function test_turning_sharing_on_in_offline_mode(): void {
		$this->given_connection( false );
		$this->given_offline_mode();
		$this->given_modules( array() );

		$this->assertSame( 200, $this->request( 'POST', 'sharing/activate' )->get_status() );
		$this->assertSame( array( 'sharedaddy' ), $this->active_modules() );
	}

	public function test_turning_a_feature_on_reports_a_host_that_keeps_it_off(): void {
		$this->given_modules( array() );
		$keep_sharing_off = function ( $modules ) {
			return array_diff( $modules, array( 'sharedaddy' ) );
		};
		add_filter( 'jetpack_active_modules', $keep_sharing_off );

		$response = $this->request( 'POST', 'sharing/activate' );

		remove_filter( 'jetpack_active_modules', $keep_sharing_off );
		$this->assertSame( 409, $response->get_status() );
	}
}
