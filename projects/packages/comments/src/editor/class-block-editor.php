<?php
/**
 * Blocks in comments.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Assets;

/**
 * Keeps the blocks the editor offers, and draws them in the comment.
 */
class Block_Editor {

	/**
	 * Singleton instance.
	 *
	 * @var Block_Editor|null
	 */
	private static $instance = null;

	/**
	 * Whether the comment being filtered now holds blocks: set at 9, cleared at 11, so the
	 * wider kses rules last for that comment's pass alone.
	 *
	 * @var bool
	 */
	private $has_blocks = false;

	/**
	 * Register the hooks. Safe to call more than once.
	 *
	 * @return Block_Editor
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Hook in around core's comment filtering.
	 */
	private function __construct() {
		// Either side of kses at 10, which lets the markup of these blocks through.
		add_filter( 'pre_comment_content', array( $this, 'keep_allowed_blocks' ), 9 );
		add_filter( 'pre_comment_content', array( $this, 'forget_blocks' ), 11 );
		add_filter( 'wp_kses_allowed_html', array( $this, 'allowed_html' ), 10, 2 );
		// Ahead of wpautop at 30.
		add_filter( 'comment_text', array( __CLASS__, 'render' ), 5, 2 );
		// The edit-comment screen, for a comment that holds blocks.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin' ) );
	}

	/**
	 * Core's translations of the strings in strings.php, and the plural rules under '', in one Jed messages set.
	 *
	 * @return object
	 */
	public static function locale_data() {
		$locale = determine_locale();

		if ( 'en_US' === $locale ) {
			return (object) array();
		}

		// Keyed by the WordPress version and the package version, whose updates bring new strings.
		$key      = 'jetpack_comments_editor_i18n_' . md5( $locale . get_bloginfo( 'version' ) . Comments::PACKAGE_VERSION );
		$messages = get_transient( $key );

		if ( ! is_array( $messages ) ) {
			$messages = array();
			$wanted   = array_flip( require __DIR__ . '/strings.php' ) + array( '' => true );

			foreach ( array( 'wp-a11y', 'wp-block-editor', 'wp-block-library', 'wp-blocks', 'wp-components', 'wp-format-library', 'wp-rich-text' ) as $handle ) {
				$json = load_script_textdomain( $handle, 'default' );
				$data = is_string( $json ) ? json_decode( $json, true ) : null;

				if ( isset( $data['locale_data']['messages'] ) && is_array( $data['locale_data']['messages'] ) ) {
					$messages += array_intersect_key( $data['locale_data']['messages'], $wanted );
				}
			}

			// Core translates block titles in PHP, so they are in its .mo, not the script files.
			foreach ( array( 'Paragraph', 'List', 'List Item', 'Quote', 'Code', 'Embed' ) as $title ) {
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText, WordPress.WP.I18n.TextDomainMismatch -- Core's own strings.
				$messages[ "block title\u{0004}$title" ] = array( _x( $title, 'block title', 'default' ) );
			}

			// A day, so an updated language pack shows soon after.
			set_transient( $key, $messages, DAY_IN_SECONDS );
		}

		return (object) $messages;
	}

	/**
	 * Whether the block editor replaces the comment textarea.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Offer the block editor in the Jetpack Comments form.
		 *
		 * @since 0.4.0
		 *
		 * @param bool $enabled Whether to offer the block editor. Default true, unless WordPress.com's
		 *                      "blocks in comments" Discussion setting is off.
		 */
		return (bool) apply_filters( 'jetpack_comments_block_editor', (bool) get_option( 'enable_blocks_comments', true ) );
	}

	/**
	 * Drop any block the editor does not offer.
	 *
	 * @param string $content Slashed comment content.
	 * @return string
	 */
	public function keep_allowed_blocks( $content ) {
		$this->has_blocks = self::is_enabled() && has_blocks( $content );

		if ( ! $this->has_blocks ) {
			return $content;
		}

		return wp_slash( serialize_blocks( self::allowed( parse_blocks( wp_unslash( $content ) ) ) ) );
	}

	/**
	 * End the wider kses rules with the comment they were for.
	 *
	 * @param string $content Slashed comment content.
	 * @return string
	 */
	public function forget_blocks( $content ) {
		if ( $this->has_blocks && has_block( 'core/embed', $content ) ) {
			// Core's own kses pass over block attributes wrote & as &amp; in each embed's URL.
			// Put it back, or the editor's save no longer matches the markup when the comment is edited.
			$content = wp_slash( serialize_blocks( self::restore_urls( parse_blocks( wp_unslash( $content ) ) ) ) );
		}

		$this->has_blocks = false;

		return $content;
	}

	/**
	 * The embed URLs as they were before kses, at every depth.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array
	 */
	private static function restore_urls( array $blocks ) {
		foreach ( $blocks as &$block ) {
			if ( 'core/embed' === $block['blockName'] && isset( $block['attrs']['url'] ) && is_string( $block['attrs']['url'] ) ) {
				$block['attrs']['url'] = html_entity_decode( $block['attrs']['url'], ENT_QUOTES );
			}

			if ( $block['innerBlocks'] ) {
				$block['innerBlocks'] = self::restore_urls( $block['innerBlocks'] );
			}
		}
		unset( $block );

		return $blocks;
	}

	/**
	 * Let the tags these blocks save through kses, for a comment that holds them.
	 *
	 * @param array  $tags    Allowed tags.
	 * @param string $context The kses context.
	 * @return array
	 */
	public function allowed_html( $tags, $context ) {
		if ( 'pre_comment_content' !== $context || ! $this->has_blocks ) {
			return $tags;
		}

		return array_merge(
			$tags,
			array(
				'p'          => array(),
				'br'         => array(),
				'li'         => array(),
				// The one class each block saves, without which the editor reads it as invalid.
				'blockquote' => array(
					'cite'  => true,
					'class' => array( 'values' => array( 'wp-block-quote' ) ),
				),
				'pre'        => array( 'class' => array( 'values' => array( 'wp-block-code' ) ) ),
				'ul'         => array( 'class' => array( 'values' => array( 'wp-block-list' ) ) ),
				'ol'         => array( 'class' => array( 'values' => array( 'wp-block-list' ) ) ),
				'figure'     => array( 'class' => array( 'values' => array( 'wp-block-embed' ) ) ),
				'div'        => array( 'class' => array( 'values' => array( 'wp-block-embed__wrapper' ) ) ),
			)
		);
	}

	/**
	 * The comment's HTML without the block delimiters, and without any block the editor does not offer.
	 *
	 * @param string           $content Comment content.
	 * @param \WP_Comment|null $comment The comment, where the caller has it.
	 * @return string
	 */
	public static function render( $content, $comment = null ) {
		if ( ! has_blocks( $content ) ) {
			return $content;
		}

		// Only an approved comment on the front end draws a provider's embed; the rest show its link.
		$embed = $comment instanceof \WP_Comment && '1' === (string) $comment->comment_approved && ! is_admin();

		// With their attributes cleared, what is left of the delimiters is this shape alone.
		return (string) preg_replace( '#<!-- /?wp:[a-z0-9/-]+ /?-->#', '', serialize_blocks( self::allowed( parse_blocks( $content ), $embed ) ) );
	}

	/**
	 * Whether the edit-comment screen is open on a comment that holds blocks, and the
	 * block editor is on.
	 *
	 * @return bool
	 */
	private static function is_editing_blocks() {
		global $pagenow;

		if ( ! self::is_enabled() ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- which comment the screen shows, read only.
		$comment = 'comment.php' === $pagenow && isset( $_GET['c'] ) ? get_comment( absint( $_GET['c'] ) ) : null;

		return $comment instanceof \WP_Comment && has_blocks( $comment->comment_content );
	}

	/**
	 * Load the editor onto the edit-comment screen.
	 *
	 * @return void
	 */
	public static function enqueue_admin() {
		if ( ! self::is_editing_blocks() ) {
			return;
		}

		Assets::register_script(
			'jetpack-comments-admin',
			'../../build/admin.js',
			__FILE__,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
				'enqueue'   => true,
			)
		);

		wp_add_inline_script(
			'jetpack-comments-admin',
			'window.jetpackCommentsEditorLocale = ' . wp_json_encode( self::locale_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';'
				. 'window.jetpackCommentsEditorLabels = ' . wp_json_encode( self::labels(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'before'
		);
	}

	/**
	 * What the editor needs from PHP: its own accessible names, and the embed route.
	 *
	 * @return array
	 */
	public static function labels() {
		return array(
			'blockTools' => __( 'Block tools', 'jetpack-comments' ),
			'addBlock'   => __( 'Add block', 'jetpack-comments' ),
			'embedUrl'   => Embeds::is_enabled() ? Checkpoint_Endpoint::route_url( Embeds::ROUTE ) : '',
		);
	}

	/**
	 * The allowed blocks, at every depth.
	 *
	 * @param array     $blocks Parsed blocks.
	 * @param bool|null $render Null while saving; at render, whether embeds may draw.
	 * @return array
	 */
	private static function allowed( array $blocks, $render = null ) {
		$kept = array();

		foreach ( $blocks as $block ) {
			if ( 'core/embed' === $block['blockName'] ) {
				$block = Embeds::block( $block, $render );
				if ( $block ) {
					$kept[] = $block;
				}
				continue;
			}

			// A null name is the markup between blocks, which kses sees like any other.
			if ( null !== $block['blockName'] && ! in_array( $block['blockName'], array( 'core/paragraph', 'core/list', 'core/list-item', 'core/quote', 'core/code' ), true ) ) {
				continue;
			}

			// The markup carries everything these blocks draw; attributes only matter to the editor.
			$block['attrs'] = array();

			$inner                 = $block['innerBlocks'];
			$content               = $block['innerContent'];
			$block['innerBlocks']  = array();
			$block['innerContent'] = array();

			// Each null in innerContent marks where the next inner block goes.
			foreach ( $content as $chunk ) {
				if ( null !== $chunk ) {
					$block['innerContent'][] = $chunk;
					continue;
				}

				$child = self::allowed( array( array_shift( $inner ) ), $render );
				if ( $child ) {
					$block['innerBlocks'][]  = $child[0];
					$block['innerContent'][] = null;
				}
			}

			$kept[] = $block;
		}

		return $kept;
	}
}
