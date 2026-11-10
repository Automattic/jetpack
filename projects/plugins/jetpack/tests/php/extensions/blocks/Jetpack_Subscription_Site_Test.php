<?php
/**
 * Subscriptions navigation placement tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Subscriptions\Jetpack_Subscription_Site;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/class-jetpack-subscription-site.php';

/**
 * Subscribe blocks already placed in navigation.
 *
 * @covers \Automattic\Jetpack\Extensions\Subscriptions\Jetpack_Subscription_Site
 */
#[CoversClass( Jetpack_Subscription_Site::class )]
class Jetpack_Subscription_Site_Test extends WP_UnitTestCase {

	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Theme directories to restore after each test.
	 *
	 * @var string[]
	 */
	private $theme_directories;

	/**
	 * Enable navigation placement in a block theme.
	 */
	public function set_up() {
		parent::set_up();

		$this->theme_directories = $GLOBALS['wp_theme_directories'];
		register_theme_directory( DIR_TESTDATA . '/themedir1' );
		switch_theme( 'block-theme' );
		update_option( 'jetpack_subscriptions_subscribe_navigation_enabled', true );
		update_option( 'jetpack_subscriptions_subscribe_post_end_enabled', false );
		Jetpack_Subscription_Site::init()->handle_subscribe_block_placements();
	}

	/**
	 * Restore the theme directories.
	 */
	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->theme_directories;
		parent::tear_down();
	}

	/**
	 * Keep one Subscribe block when navigation hooks run repeatedly.
	 *
	 * @dataProvider data_navigation_placement
	 *
	 * @param string $subscribe_markup Existing Subscribe block markup.
	 * @param array  $expected_attrs   Expected Subscribe block attributes.
	 * @param string $callback         Block hooks callback.
	 */
	#[DataProvider( 'data_navigation_placement' )]
	public function test_navigation_placement_does_not_duplicate_existing_subscribe_block( $subscribe_markup, $expected_attrs, $callback ) {
		$this->assertTrue( wp_is_block_theme() );
		$post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->' . $subscribe_markup,
			)
		);

		$content = apply_block_hooks_to_content_from_post_object( $post->post_content, $post, $callback );
		$this->assertSame( 1, substr_count( $content, '<!-- wp:jetpack/subscriptions ' ) );
		$this->assertStringContainsString( get_comment_delimited_block_content( 'jetpack/subscriptions', $expected_attrs, '' ), $content );
		$this->assertSame( $content, apply_block_hooks_to_content_from_post_object( $content, $post, $callback ) );
	}

	/**
	 * @dataProvider data_navigation_post_types
	 *
	 * @param string $post_type Post type containing the navigation.
	 */
	#[DataProvider( 'data_navigation_post_types' )]
	public function test_saved_navigation_keeps_subscribe_removal_after_non_rest_update( $post_type ) {
		$subscribe = '<!-- wp:jetpack/subscriptions /-->';
		$content   = '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->' . $subscribe;
		if ( 'wp_template_part' === $post_type ) {
			$content = '<!-- wp:navigation -->' . $content . '<!-- /wp:navigation -->';
		}
		$post = self::factory()->post->create_and_get(
			array(
				'post_type'    => $post_type,
				'post_name'    => 'header',
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);

		if ( 'wp_navigation' === $post_type ) {
			$changes = update_ignored_hooked_blocks_postmeta( (object) (array) $post );
		} else {
			wp_set_object_terms( $post->ID, get_stylesheet(), 'wp_theme' );
			wp_set_object_terms( $post->ID, 'header', 'wp_template_part_area' );
			$changes = inject_ignored_hooked_blocks_metadata_attributes( (object) (array) $post );
		}
		$this->assertNotWPError( $changes );
		$this->assertSame( $post->ID, wp_update_post( wp_slash( (array) $changes ) ) );

		$content = get_post( $post->ID )->post_content;
		$this->assertStringContainsString( $subscribe, $content );
		wp_update_post(
			wp_slash(
				array(
					'ID'           => $post->ID,
					'post_content' => str_replace( $subscribe, '', $content ),
				)
			)
		);

		$post = get_post( $post->ID );
		if ( 'wp_navigation' === $post_type ) {
			$content = apply_block_hooks_to_content_from_post_object( $post->post_content, $post );
		} else {
			$template       = new WP_Block_Template();
			$template->area = 'header';
			$content        = apply_block_hooks_to_content( $post->post_content, $template );
		}
		$this->assertFalse( has_block( 'jetpack/subscriptions', $content ) );
	}

	/**
	 * @return array
	 */
	public static function data_navigation_post_types() {
		return array(
			'referenced menu' => array( 'wp_navigation' ),
			'inline menu'     => array( 'wp_template_part' ),
		);
	}

	/**
	 * Navigation contents for both block hooks callbacks.
	 *
	 * @return array
	 */
	public static function data_navigation_placement() {
		$manual_attrs    = array(
			'className'        => 'is-style-button',
			'submitButtonText' => 'Join us',
		);
		$automatic_attrs = array_merge( $manual_attrs, array( 'appSource' => 'subscribe-block-navigation' ) );
		$manual_block    = get_comment_delimited_block_content( 'jetpack/subscriptions', $manual_attrs, '' );
		$cases           = array(
			'manual'    => array( $manual_block, $manual_attrs ),
			'automatic' => array( get_comment_delimited_block_content( 'jetpack/subscriptions', $automatic_attrs, '' ), $automatic_attrs ),
			'nested'    => array( '<!-- wp:navigation-submenu {"label":"More"} -->' . $manual_block . '<!-- /wp:navigation-submenu -->', $manual_attrs ),
			'absent'    => array(
				'',
				array(
					'className' => 'is-style-button',
					'appSource' => 'subscribe-block-navigation',
				),
			),
		);

		$data = array();
		foreach ( array( 'insert_hooked_blocks', 'insert_hooked_blocks_and_set_ignored_hooked_blocks_metadata' ) as $callback ) {
			foreach ( $cases as $name => $case ) {
				$data[ $name . ': ' . $callback ] = array_merge( $case, array( $callback ) );
			}
		}
		return $data;
	}
}
