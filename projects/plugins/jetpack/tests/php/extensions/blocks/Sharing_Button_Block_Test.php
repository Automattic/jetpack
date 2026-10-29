<?php
/**
 * Sharing Button block registration tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Extensions\Sharing_Button_Block\Share_WordPress_Com_Block;
use Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Hooked_Blocks;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use function Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/sharing-button/sharing-button.php';

/**
 * @covers ::Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block
 * @covers ::Automattic\Jetpack\Extensions\Sharing_Button_Block\render_block
 * @covers \Automattic\Jetpack\Extensions\Sharing_Button_Block\Share_WordPress_Com_Block
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Sharing_Button_Block\register_block' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Sharing_Button_Block\render_block' )]
#[CoversClass( Share_WordPress_Com_Block::class )]
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
	 * The repost link prefills a WordPress.com draft, without the text of a gated post.
	 *
	 * @dataProvider provide_reposted_posts
	 * @param array  $post_args     Post fields on top of the title.
	 * @param string $expected_text Expected `text` argument.
	 */
	#[DataProvider( 'provide_reposted_posts' )]
	public function test_repost_url_prefills_wpcom_draft( $post_args, $expected_text ) {
		$post = self::factory()->post->create_and_get( array_merge( array( 'post_title' => 'Tips & tricks' ), $post_args ) );

		$url = ( new Share_WordPress_Com_Block( 'wordpress-com' ) )->get_repost_url( $post );
		wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertStringStartsWith( 'https://wordpress.com/post?', $url );
		$this->assertSame(
			array(
				'url'           => get_permalink( $post ),
				'title'         => 'Tips & tricks',
				'text'          => $expected_text,
				'is_post_share' => 'true',
			),
			$args
		);
	}

	/**
	 * @return array
	 */
	public static function provide_reposted_posts() {
		return array(
			'excerpt'            => array( array( 'post_excerpt' => 'A short summary.' ), 'A short summary.' ),
			'no excerpt'         => array(
				array(
					'post_excerpt' => '',
					'post_content' => '<!-- wp:paragraph --><p>Words from the post body.</p><!-- /wp:paragraph -->',
				),
				'Words from the post body.',
			),
			'password-protected' => array(
				array(
					'post_excerpt'  => 'A short summary.',
					'post_password' => 'secret',
				),
				'',
			),
			'subscribers only'   => array(
				array(
					'post_excerpt' => '',
					'post_content' => 'Words for subscribers.',
					'meta_input'   => array( '_jetpack_newsletter_access' => 'subscribers' ),
				),
				'',
			),
		);
	}
}
