<?php
/**
 * Tests for the Sharing Buttons and Like blocks hooked into templates.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Hooked_Blocks;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Block_Names;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_Environment;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Block_Template;
use WP_Post;
use WP_Query;

require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Hooked_Blocks
 * @covers \Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Sharing_Buttons_Markup
 */
#[CoversClass( Hooked_Blocks::class )]
#[CoversClass( Sharing_Buttons_Markup::class )]
class Hooked_Blocks_Test extends BaseTestCase {

	use Section_Environment;

	private const CONTENT = '<!-- wp:post-title /--><!-- wp:post-content {"layout":{"type":"constrained"}} /-->';

	private const PLACED  = array( 'core/post-title', 'core/post-content', Block_Names::SHARING_BUTTONS, Block_Names::LIKE );
	private const NOTHING = array( 'core/post-title', 'core/post-content' );

	/**
	 * The main query, put back after cases that fake a singular request.
	 *
	 * @var WP_Query|null
	 */
	private $main_query;

	/**
	 * A site where both blocks can be placed, set to place them after the content.
	 */
	public function set_up() {
		parent::set_up();

		$this->main_query = $GLOBALS['wp_query'] ?? null;
		$this->set_up_site();
		$this->given_block_theme();
		$this->given_connection( true );
		$this->given_modules( array( 'blocks' ) );
		Template_Placements::update( Template_Placements::FEATURE_SHARING, array( Template_Placements::AFTER_CONTENT ) );
		Template_Placements::update( Template_Placements::FEATURE_LIKES, array( Template_Placements::AFTER_CONTENT ) );

		Hooked_Blocks::init();
	}

	/**
	 * Leave no hooks, options or constants behind.
	 */
	public function tear_down() {
		remove_all_filters( 'hooked_block_types' );
		remove_all_filters( 'hooked_block_' . Block_Names::SHARING_BUTTONS );
		remove_all_filters( 'hooked_block_' . Block_Names::LIKE );
		unregister_post_type( 'post-card' );

		foreach ( array_merge( Template_Placements::OPTIONS, array( 'sharing-services', 'sharing-options', 'disabled_likes', 'disabled_reblogs' ) ) as $option ) {
			delete_option( $option );
		}

		$GLOBALS['wp_query'] = $this->main_query;
		Constants::clear_constants();
		$this->tear_down_site();

		parent::tear_down();
	}

	/**
	 * A template, as core builds one from a theme file or a saved post.
	 *
	 * @param string        $slug       Template slug.
	 * @param string        $type       `wp_template` or `wp_template_part`.
	 * @param string[]|null $post_types Post types a theme's custom template declares.
	 */
	private static function template( string $slug, string $type = 'wp_template', ?array $post_types = null ): WP_Block_Template {
		$template             = new WP_Block_Template();
		$template->slug       = $slug;
		$template->type       = $type;
		$template->post_types = $post_types;

		return $template;
	}

	/**
	 * Fake a front-end request for a single post.
	 *
	 * @param string $post_type    Post type of the post being viewed.
	 * @param string $post_content Its content.
	 */
	private static function view( string $post_type, string $post_content = '' ): void {
		$query                 = new WP_Query();
		$query->is_singular    = true;
		$query->queried_object = new WP_Post(
			(object) array(
				'post_type'    => $post_type,
				'post_content' => $post_content,
			)
		);
		$GLOBALS['wp_query']   = $query;
	}

	/**
	 * Top-level blocks after applying block hooks, each wrapper group named after the block it holds.
	 *
	 * @param mixed  $context Template, pattern array or post.
	 * @param string $content Serialized blocks.
	 * @return string[]
	 */
	private function placed_blocks( $context, string $content = self::CONTENT ): array {
		return self::top_level_blocks( apply_block_hooks_to_content( $content, $context, 'insert_hooked_blocks' ) );
	}

	/**
	 * Top-level blocks in some markup, each wrapper group named after the block it holds.
	 *
	 * @param string $markup Serialized blocks.
	 * @return string[]
	 */
	private static function top_level_blocks( string $markup ): array {
		$names = array();

		foreach ( parse_blocks( $markup ) as $block ) {
			if ( null !== $block['blockName'] ) {
				$names[] = 'core/group' === $block['blockName'] ? $block['innerBlocks'][0]['blockName'] : $block['blockName'];
			}
		}

		return $names;
	}

	/**
	 * The hooked Sharing Buttons block placed after the content of the single template.
	 *
	 * @return array
	 */
	private function placed_sharing_buttons(): array {
		Template_Placements::update( Template_Placements::FEATURE_LIKES, array() );
		$blocks = parse_blocks( apply_block_hooks_to_content( self::CONTENT, self::template( 'single' ), 'insert_hooked_blocks' ) );

		return end( $blocks )['innerBlocks'][0];
	}

	/**
	 * @return array<string, array{0: mixed, 1: bool}>
	 */
	public static function provide_contexts(): array {
		return array(
			'single template'                           => array( self::template( 'single' ), true ),
			'single post template'                      => array( self::template( 'single-post' ), true ),
			'template for one post'                     => array( self::template( 'single-post-hello-world' ), true ),
			'page template'                             => array( self::template( 'page' ), true ),
			'template for one page'                     => array( self::template( 'page-about' ), true ),
			'singular template'                         => array( self::template( 'singular' ), true ),
			'theme custom template for posts'           => array( self::template( 'single-with-sidebar', 'wp_template', array( 'post' ) ), true ),
			'theme custom template for pages and posts' => array( self::template( 'blank', 'wp_template', array( 'page', 'post' ) ), true ),
			'theme custom template for products'        => array( self::template( 'wide', 'wp_template', array( 'product' ) ), false ),
			'custom post type template'                 => array( self::template( 'single-product' ), false ),
			'post type template starting with post'     => array( self::template( 'single-postcard' ), false ),
			'template for a post type named post-card'  => array( self::template( 'single-post-card' ), false ),
			'index template'                            => array( self::template( 'index' ), false ),
			'archive template'                          => array( self::template( 'archive' ), false ),
			'template part'                             => array( self::template( 'single', 'wp_template_part' ), false ),
			'pattern for single templates'              => array( array( 'templateTypes' => array( 'single' ) ), true ),
			'pattern for page templates'                => array( array( 'templateTypes' => array( 'page' ) ), true ),
			'pattern for singular templates'            => array( array( 'templateTypes' => array( 'singular' ) ), true ),
			'pattern for one post\'s template'          => array( array( 'templateTypes' => array( 'single-post-hello-world' ) ), true ),
			'pattern for archives, outside a post'      => array( array( 'templateTypes' => array( 'archive' ) ), false ),
			'pattern without template types'            => array( array( 'name' => 'theme/content' ), false ),
			'post content'                              => array( new WP_Post( (object) array( 'post_type' => 'post' ) ), false ),
		);
	}

	/**
	 * @dataProvider provide_contexts
	 *
	 * @param mixed $context Where the anchor sits.
	 * @param bool  $placed  Whether the blocks are placed there.
	 */
	#[DataProvider( 'provide_contexts' )]
	public function test_places_the_blocks_in_single_post_and_page_contexts_only( $context, bool $placed ): void {
		register_post_type( 'post-card' );

		$this->assertSame( $placed ? self::PLACED : self::NOTHING, $this->placed_blocks( $context ) );
	}

	/**
	 * @return array<string, array{0: mixed, 1: string, 2: bool}>
	 */
	public static function provide_singular_requests(): array {
		$untyped_pattern = array( 'name' => 'theme/content' );

		return array(
			'untyped pattern, a post'          => array( $untyped_pattern, 'post', true ),
			'untyped pattern, a page'          => array( $untyped_pattern, 'page', true ),
			'untyped pattern, a product'       => array( $untyped_pattern, 'product', false ),
			'single template, a product'       => array( self::template( 'single' ), 'product', false ),
			'singular template, an attachment' => array( self::template( 'singular' ), 'attachment', false ),
			'custom template, a post'          => array( self::template( 'wp-custom-template-wide' ), 'post', true ),
		);
	}

	/**
	 * @dataProvider provide_singular_requests
	 *
	 * @param mixed  $context   Where the anchor sits.
	 * @param string $post_type Post type of the post being viewed.
	 * @param bool   $placed    Whether the blocks are placed.
	 */
	#[DataProvider( 'provide_singular_requests' )]
	public function test_places_the_blocks_only_while_viewing_a_post_or_page( $context, string $post_type, bool $placed ): void {
		self::view( $post_type );

		$this->assertSame( $placed ? self::PLACED : self::NOTHING, $this->placed_blocks( $context ) );
	}

	/**
	 * Through core's own template loading, which must not reach back into it.
	 */
	public function test_places_each_block_on_its_side_of_the_content_in_the_theme_templates(): void {
		Template_Placements::update( Template_Placements::FEATURE_SHARING, array( Template_Placements::BEFORE_CONTENT ) );
		$expected = array( 'core/post-title', Block_Names::SHARING_BUTTONS, 'core/post-content', Block_Names::LIKE );

		$this->assertSame( $expected, self::top_level_blocks( get_block_template( get_stylesheet() . '//single' )->content ) );
		$this->assertSame( $expected, self::top_level_blocks( get_block_template( get_stylesheet() . '//page' )->content ) );
	}

	/**
	 * @return array<string, array{0: string[], 1: array<string, mixed>, 2: string[], 3: string[]}>
	 */
	public static function provide_gates(): array {
		$both        = array( Block_Names::SHARING_BUTTONS, Block_Names::LIKE );
		$no_services = array(
			'sharing-services' => array(
				'visible' => array(),
				'hidden'  => array(),
			),
		);

		return array(
			'legacy features off'                      => array( array( 'blocks' ), array(), array(), $both ),
			'Sharing module on'                        => array( array( 'blocks', 'sharedaddy' ), array(), array(), array( Block_Names::LIKE ) ),
			'Sharing module on, every service removed' => array( array( 'blocks', 'sharedaddy' ), $no_services, array(), $both ),
			'Likes module on'                          => array( array( 'blocks', 'likes' ), array(), array(), array( Block_Names::SHARING_BUTTONS ) ),
			'classic theme'                            => array( array( 'blocks' ), array(), array( 'classic theme' ), array() ),
			'Blocks module off'                        => array( array(), array(), array(), array() ),
			'disconnected'                             => array( array( 'blocks' ), array(), array( 'disconnected' ), array() ),
			// Offline mode loads Jetpack's blocks, but the Like block needs a connection.
			'offline mode'                             => array( array( 'blocks' ), array(), array( 'offline' ), array( Block_Names::SHARING_BUTTONS ) ),
			'Simple, legacy buttons on'                => array( array(), array(), array( 'simple' ), array() ),
			'Simple, both switched to the blocks'      => array(
				array(),
				$no_services + array(
					'disabled_likes'   => 1,
					'disabled_reblogs' => 1,
				),
				array( 'simple' ),
				$both,
			),
		);
	}

	/**
	 * @dataProvider provide_gates
	 *
	 * @param string[]             $modules  Active modules.
	 * @param array<string, mixed> $options  Options to store.
	 * @param string[]             $flags    Departures from a connected site on a block theme.
	 * @param string[]             $expected Blocks placed after the content.
	 */
	#[DataProvider( 'provide_gates' )]
	public function test_places_each_block_only_where_it_loads_and_the_legacy_buttons_are_gone( array $modules, array $options, array $flags, array $expected ): void {
		$this->given_modules( $modules );
		foreach ( $options as $name => $value ) {
			update_option( $name, $value );
		}
		if ( in_array( 'classic theme', $flags, true ) ) {
			remove_filter( 'stylesheet', array( $this, 'pin_stylesheet' ) );
			remove_filter( 'template', array( $this, 'pin_stylesheet' ) );
			wp_clean_themes_cache();
		}
		if ( in_array( 'disconnected', $flags, true ) || in_array( 'simple', $flags, true ) ) {
			$this->given_connection( false );
		}
		if ( in_array( 'offline', $flags, true ) ) {
			$this->given_offline_mode();
		}
		if ( in_array( 'simple', $flags, true ) ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}

		$this->assertSame( array_merge( self::NOTHING, $expected ), $this->placed_blocks( self::template( 'single' ) ) );
	}

	/**
	 * Same-priority filters run in registration order, and Simple sets this package up after Subscribe.
	 */
	public function test_places_the_blocks_ahead_of_one_hooked_by_default_after_them(): void {
		remove_all_filters( 'hooked_block_types' );
		add_filter(
			'hooked_block_types',
			static function ( $types, $position, $anchor ) {
				if ( 'core/post-content' === $anchor && 'after' === $position ) {
					$types[] = 'jetpack/subscriptions';
				}
				return $types;
			},
			10,
			3
		);
		Hooked_Blocks::init();

		$this->assertSame(
			array_merge( self::PLACED, array( 'jetpack/subscriptions' ) ),
			$this->placed_blocks( self::template( 'single' ) )
		);
	}

	/**
	 * @return array<string, array{0: mixed, 1: string, 2: string[], 3?: string}>
	 */
	public static function provide_sharing_buttons_already_handled(): array {
		$ignored  = '<!-- wp:post-title /--><!-- wp:post-content {"metadata":{"ignoredHookedBlocks":["' . Block_Names::SHARING_BUTTONS . '"]}} /-->';
		$by_hand  = self::CONTENT . '<!-- wp:group --><div class="wp-block-group"><!-- wp:jetpack/sharing-buttons /--></div><!-- /wp:group -->';
		$template = self::template( 'single' );

		$template->content = $by_hand;

		return array(
			// Core records a block the owner removed from that anchor under the hooked type.
			'removed by the owner'               => array( self::template( 'single' ), $ignored, array( 'core/post-title', 'core/post-content', Block_Names::LIKE ) ),
			'added to the template by hand'      => array( $template, $by_hand, array_merge( self::NOTHING, array( Block_Names::LIKE, Block_Names::SHARING_BUTTONS ) ) ),
			'added to the pattern by hand'       => array(
				array(
					'templateTypes' => array( 'single' ),
					'content'       => $by_hand,
				),
				$by_hand,
				array_merge( self::NOTHING, array( Block_Names::LIKE, Block_Names::SHARING_BUTTONS ) ),
			),
			// Core passes a theme pattern without its content the first time it is fetched.
			'added to the theme pattern by hand' => array(
				array(
					'templateTypes' => array( 'single' ),
					'filePath'      => dirname( __DIR__ ) . '/fixtures/patterns/sharing-buttons-by-hand.html',
				),
				$by_hand,
				array_merge( self::NOTHING, array( Block_Names::LIKE, Block_Names::SHARING_BUTTONS ) ),
			),
			'added to the post by hand'          => array( self::template( 'single' ), self::CONTENT, array_merge( self::NOTHING, array( Block_Names::LIKE ) ), '<!-- wp:jetpack/sharing-buttons /-->' ),
		);
	}

	/**
	 * @dataProvider provide_sharing_buttons_already_handled
	 *
	 * @param mixed    $context  Template or pattern, holding the content as core passes it.
	 * @param string   $content  Serialized blocks.
	 * @param string[] $expected Top-level blocks.
	 * @param string   $post     Content of the post being viewed, if any.
	 */
	#[DataProvider( 'provide_sharing_buttons_already_handled' )]
	public function test_leaves_out_a_block_the_template_already_handles( $context, string $content, array $expected, string $post = '' ): void {
		if ( '' !== $post ) {
			self::view( 'post', $post );
		}

		$this->assertSame( $expected, $this->placed_blocks( $context, $content ) );
	}

	/**
	 * The hooked block's markup must match what the editor saves, or the Site Editor flags it as invalid.
	 */
	public function test_builds_sharing_buttons_the_editor_saves_the_same_way(): void {
		Template_Placements::update( Template_Placements::FEATURE_LIKES, array() );
		Template_Placements::update( Template_Placements::FEATURE_SHARING, array( Template_Placements::AFTER_CONTENT ) );

		$this->assertSame(
			'<!-- wp:post-content {"layout":{"type":"constrained"}} /-->'
			. '<!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group">'
			. '<!-- wp:jetpack/sharing-buttons --><ul class="wp-block-jetpack-sharing-buttons has-normal-icon-size jetpack-sharing-buttons__services-list" id="jetpack-sharing-serivces-list">'
			. '<!-- wp:jetpack/sharing-button {"service":"facebook","label":"Facebook"} /-->'
			. '<!-- wp:jetpack/sharing-button {"service":"x","label":"X"} /-->'
			. '<!-- wp:jetpack/sharing-button {"service":"mastodon","label":"Mastodon"} /-->'
			. '</ul><!-- /wp:jetpack/sharing-buttons -->'
			. '</div><!-- /wp:group -->',
			apply_block_hooks_to_content( '<!-- wp:post-content {"layout":{"type":"constrained"}} /-->', self::template( 'single' ), 'insert_hooked_blocks' )
		);
	}

	/**
	 * Without a layout to copy, the group gets none rather than an invalid one.
	 */
	public function test_wraps_the_blocks_in_a_plain_group_when_the_post_content_has_no_layout(): void {
		$blocks = parse_blocks( apply_block_hooks_to_content( '<!-- wp:post-content /-->', self::template( 'single' ), 'insert_hooked_blocks' ) );

		$this->assertSame( array(), $blocks[1]['attrs'] );
	}

	/**
	 * @return array<string, array{0: array<string, mixed>, 1: array<string, string>, 2: string|null}>
	 */
	public static function provide_legacy_services(): array {
		$defaults = array(
			'facebook' => 'Facebook',
			'x'        => 'X',
			'mastodon' => 'Mastodon',
		);

		return array(
			'never configured'                => array( array(), $defaults, null ),
			'renamed, custom and unsupported' => array(
				array(
					'sharing-services' => array(
						'visible' => array( 'email', 'twitter', 'x', 'jetpack-whatsapp', 'custom-1700000000', 'skype', 'print', 'bluesky' ),
						'hidden'  => array( 'linkedin' ),
					),
					'sharing-options'  => array( 'global' => array( 'button_style' => 'icon' ) ),
				),
				array(
					'mail'     => 'Mail',
					'x'        => 'X',
					'whatsapp' => 'WhatsApp',
					'print'    => 'Print',
					'bluesky'  => 'Bluesky',
				),
				'icon',
			),
			'nothing the block offers'        => array(
				array(
					'sharing-services' => array(
						'visible' => array( 'custom-1700000000', 'skype' ),
						'hidden'  => array(),
					),
				),
				$defaults,
				null,
			),
			'a button style the block lacks'  => array(
				array( 'sharing-options' => array( 'global' => array( 'button_style' => 'fancy' ) ) ),
				$defaults,
				null,
			),
			'official buttons'                => array(
				array( 'sharing-options' => array( 'global' => array( 'button_style' => 'official' ) ) ),
				$defaults,
				null,
			),
			'every button behind More'        => array(
				array(
					'sharing-services' => array(
						'visible' => array( 'skype' ),
						'hidden'  => array( 'email', 'print' ),
					),
				),
				array(
					'mail'  => 'Mail',
					'print' => 'Print',
				),
				null,
			),
		);
	}

	/**
	 * Without a label, the default "icon and text" style shows the raw service slug.
	 *
	 * @dataProvider provide_legacy_services
	 *
	 * @param array<string, mixed>  $options    Options to store.
	 * @param array<string, string> $buttons    Expected labels, keyed by service.
	 * @param string|null           $style_type Expected `styleType`, or null for the block's default.
	 */
	#[DataProvider( 'provide_legacy_services' )]
	public function test_carries_the_legacy_buttons_over_to_the_block( array $options, array $buttons, ?string $style_type ): void {
		foreach ( $options as $name => $value ) {
			update_option( $name, $value );
		}

		$block = $this->placed_sharing_buttons();

		$this->assertSame(
			$buttons,
			array_column( array_column( $block['innerBlocks'], 'attrs' ), 'label', 'service' )
		);
		$this->assertSame( $style_type, $block['attrs']['styleType'] ?? null );
		$this->assertCount( count( $buttons ) + 2, $block['innerContent'] );
	}

	/**
	 * Other code may hook these blocks elsewhere; that is not ours to rebuild.
	 */
	public function test_leaves_the_blocks_alone_elsewhere(): void {
		$block    = array(
			'blockName'    => Block_Names::LIKE,
			'attrs'        => array(),
			'innerBlocks'  => array(),
			'innerContent' => array(),
		);
		$content  = array( 'blockName' => 'core/post-content' );
		$template = self::template( 'single' );

		$this->assertSame( $block, Hooked_Blocks::build_like( $block, Block_Names::LIKE, 'first_child', $content ) );
		$this->assertSame( $block, Hooked_Blocks::build_sharing_buttons( $block, Block_Names::SHARING_BUTTONS, 'after', array( 'blockName' => 'core/post-title' ) ) );
		$this->assertSame( array(), Hooked_Blocks::hook_block_types( array(), 'last_child', 'core/post-content', $template ) );
	}
}
