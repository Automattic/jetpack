<?php
/**
 * Sharing Button block registration tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Extensions\Sharing_Button_Block\Jetpack_WordPress_Modal;
use Automattic\Jetpack\Extensions\Sharing_Button_Block\Share_WordPress_Block;
use Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Hooked_Blocks;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use function Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/sharing-button/sharing-button.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/sharing-button/components/class-jetpack-wordpress-modal.php';

/**
 * @covers ::Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block
 * @covers ::Automattic\Jetpack\Extensions\Sharing_Button_Block\render_block
 * @covers \Automattic\Jetpack\Extensions\Sharing_Button_Block\Share_WordPress_Block
 * @covers \Automattic\Jetpack\Extensions\Sharing_Button_Block\Jetpack_WordPress_Modal
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Sharing_Button_Block\render_block' )]
#[CoversClass( Share_WordPress_Block::class )]
#[CoversClass( Jetpack_WordPress_Modal::class )]
class Sharing_Button_Block_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private const BLOCK_NAME = 'jetpack/sharing-button';

	/**
	 * Whether the block was registered before the test ran.
	 *
	 * @var bool
	 */
	private $was_registered;

	/**
	 * Whether IS_WPCOM was overridden before the test ran, and with what.
	 *
	 * @var array{0: bool, 1: mixed}
	 */
	private $wpcom_override;

	/**
	 * Detach the hooked-blocks filter that load-jetpack.php may already have added.
	 */
	public function set_up() {
		parent::set_up();
		$this->was_registered = WP_Block_Type_Registry::get_instance()->is_registered( self::BLOCK_NAME );
		$this->wpcom_override = array(
			array_key_exists( 'IS_WPCOM', Constants::$set_constants ),
			Constants::$set_constants['IS_WPCOM'] ?? null,
		);
		remove_filter( 'hooked_block_types', array( Hooked_Blocks::class, 'hook_block_types' ), 5 );
	}

	/**
	 * Restore IS_WPCOM and the block registry; WP_UnitTestCase restores the filters.
	 */
	public function tear_down() {
		if ( $this->wpcom_override[0] ) {
			Constants::set_constant( 'IS_WPCOM', $this->wpcom_override[1] );
		} else {
			Constants::clear_single_constant( 'IS_WPCOM' );
		}
		if ( ! $this->was_registered && WP_Block_Type_Registry::get_instance()->is_registered( self::BLOCK_NAME ) ) {
			unregister_block_type( self::BLOCK_NAME );
		}
		parent::tear_down();
	}

	/**
	 * Registering the block hooks the template placements on Simple only.
	 *
	 * @dataProvider provide_hosts
	 * @param bool     $simple   Whether the site runs on WordPress.com Simple.
	 * @param int|bool $expected `has_filter()` result for the placements callback.
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_register_block_hooks_template_placements_on_simple_only( $simple, $expected ) {
		Constants::set_constant( 'IS_WPCOM', $simple );

		register_block();

		$this->assertSame( $expected, has_filter( 'hooked_block_types', array( Hooked_Blocks::class, 'hook_block_types' ) ) );
	}

	/**
	 * @return array
	 */
	public static function provide_hosts() {
		return array(
			'Simple'      => array( true, 5 ),
			'self-hosted' => array( false, false ),
		);
	}

	/**
	 * Two buttons for one service and post must not share a label id, nor point at each other's label.
	 */
	public function test_repeated_button_labels_itself_with_its_own_span() {
		register_block();
		$post_id         = self::factory()->post->create();
		$GLOBALS['post'] = get_post( $post_id );
		$button          = '<!-- wp:jetpack/sharing-button {"service":"facebook"} /-->';

		$tags  = new WP_HTML_Tag_Processor( do_blocks( $button . $button ) );
		$links = array();
		while ( $tags->next_tag() ) {
			if ( 'A' === $tags->get_tag() ) {
				$links[] = array(
					'shared'   => $tags->get_attribute( 'data-shared' ),
					'label_by' => $tags->get_attribute( 'aria-labelledby' ),
				);
			} elseif ( 'SPAN' === $tags->get_tag() && true === $tags->get_attribute( 'hidden' ) ) {
				$links[ count( $links ) - 1 ]['label_id'] = $tags->get_attribute( 'id' );
			}
		}

		$this->assertCount( 2, $links );
		$this->assertNotSame( $links[0]['label_id'], $links[1]['label_id'] );
		foreach ( $links as $link ) {
			$this->assertSame( $link['label_id'], $link['label_by'] );
			$this->assertSame( "sharing-facebook-$post_id", $link['shared'] );
		}
	}

	/**
	 * The repost link hands WordPress.com the title and URL, and none of the post's text.
	 */
	public function test_repost_url_prefills_wpcom_draft() {
		$post = self::factory()->post->create_and_get(
			array(
				'post_title'   => 'Tips & tricks',
				'post_excerpt' => 'A short summary.',
			)
		);

		$url = ( new Share_WordPress_Block( 'wordpress' ) )->get_repost_url( $post ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText
		wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertStringStartsWith( 'https://wordpress.com/post?', $url );
		$this->assertSame(
			array(
				'url'           => get_permalink( $post ),
				'title'         => 'Tips & tricks',
				'is_post_share' => 'true',
			),
			$args
		);
	}

	/**
	 * The own-site link opens the reader's editor, with only the URL as core's content.
	 *
	 * @dataProvider provide_reader_sites
	 * @param string $site          Site address the reader entered.
	 * @param string $expected_base Expected link before its query.
	 */
	#[DataProvider( 'provide_reader_sites' )]
	public function test_site_repost_url_opens_the_readers_editor( $site, $expected_base ) {
		$post = self::factory()->post->create_and_get( array( 'post_title' => 'Tips & tricks' ) );

		$url = ( new Share_WordPress_Block( 'wordpress' ) )->get_site_repost_url( $post, $site ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText
		wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertSame( $expected_base, strtok( $url, '?' ) );
		$this->assertSame( 'true', $args['is_post_share'] );
		$this->assertSame( 'Tips & tricks', $args['post_title'] );
		$this->assertSame( get_permalink( $post ), $args['content'] );
	}

	/**
	 * @return array
	 */
	public static function provide_reader_sites() {
		return array(
			'bare domain'  => array( ' example.com ', 'https://example.com/wp-admin/post-new.php' ),
			'http'         => array( 'http://example.com', 'http://example.com/wp-admin/post-new.php' ),
			'subdirectory' => array( 'https://example.com/wordpress/', 'https://example.com/wordpress/wp-admin/post-new.php' ),
		);
	}

	/**
	 * An address Share_Destination refuses gets no link.
	 */
	public function test_site_repost_url_refuses_unusable_addresses() {
		$post = self::factory()->post->create_and_get();

		$this->assertNull( ( new Share_WordPress_Block( 'wordpress' ) )->get_site_repost_url( $post, 'javascript:alert(1)' ) ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText
	}

	/**
	 * Both choices post back their destination with a valid nonce, or the repost fails the nonce check.
	 */
	public function test_modal_offers_both_destinations_with_a_nonce() {
		ob_start();
		Jetpack_WordPress_Modal::render_modal();
		$tags = new WP_HTML_Tag_Processor( ob_get_clean() );

		$destinations = array();
		$nonces       = array();
		while ( $tags->next_tag( 'INPUT' ) ) {
			$name = $tags->get_attribute( 'name' );
			if ( 'jetpack-wordpress-destination' === $name ) {
				$destinations[] = (string) $tags->get_attribute( 'value' );
			} elseif ( '_wpnonce' === $name ) {
				$nonces[] = (string) $tags->get_attribute( 'value' );
			}
		}

		$this->assertSame( array( 'wordpress.com', 'site' ), $destinations );
		$this->assertCount( 2, $nonces );
		foreach ( $nonces as $nonce ) {
			$this->assertSame( 1, wp_verify_nonce( $nonce, Jetpack_WordPress_Modal::NONCE_ACTION ) );
		}
	}
}
