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
		add_filter( 'pre_comment_content', array( $this, 'keep_alignment_classes' ), 11 );
		add_filter( 'wp_kses_allowed_html', array( $this, 'allowed_html' ), 10, 2 );
		// Ahead of wpautop at 30.
		add_filter( 'comment_text', array( __CLASS__, 'render' ), 5 );
		// The edit-comment screen, for a comment that holds blocks.
		add_filter( 'wp_editor_settings', array( __CLASS__, 'plain_editor' ), 10, 2 );
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

		// Keyed by version too: an update brings new translation files.
		$key      = 'jetpack_comments_editor_i18n_' . md5( $locale . get_bloginfo( 'version' ) );
		$messages = get_transient( $key );

		if ( ! is_array( $messages ) ) {
			$messages = array();

			foreach ( array( 'wp-a11y', 'wp-block-editor', 'wp-block-library', 'wp-blocks', 'wp-components', 'wp-format-library', 'wp-rich-text' ) as $handle ) {
				$json = load_script_textdomain( $handle, 'default' );
				$data = is_string( $json ) ? json_decode( $json, true ) : null;

				if ( isset( $data['locale_data']['messages'] ) && is_array( $data['locale_data']['messages'] ) ) {
					$messages += array_intersect_key( $data['locale_data']['messages'], array_flip( require __DIR__ . '/strings.php' ) + array( '' => true ) );
				}
			}

			// Core translates block titles in PHP, so they are in its .mo, not the script files.
			foreach ( array( 'Paragraph', 'List', 'List Item', 'Quote', 'Code' ) as $title ) {
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText, WordPress.WP.I18n.TextDomainMismatch -- Core's own strings.
				$messages[ "block title\u{0004}$title" ] = array( _x( $title, 'block title', 'default' ) );
			}

			set_transient( $key, $messages, WEEK_IN_SECONDS );
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
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether to offer the block editor. Default the site's "blocks in
		 *                      comments" Discussion setting, which is on unless turned off.
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
	 * Cut every class kses let through down to the editor's text alignment. After kses,
	 * so this filters what is stored, not what one parser thinks kses will keep.
	 *
	 * @param string $content Slashed comment content.
	 * @return string
	 */
	public function keep_alignment_classes( $content ) {
		if ( ! $this->has_blocks ) {
			return $content;
		}

		$this->has_blocks = false;
		$tags             = new \WP_HTML_Tag_Processor( wp_unslash( $content ) );

		while ( $tags->next_tag() ) {
			$classes = array_intersect(
				preg_split( '/\s+/', (string) $tags->get_attribute( 'class' ) ),
				array( 'has-text-align-left', 'has-text-align-center', 'has-text-align-right' )
			);

			if ( $classes ) {
				$tags->set_attribute( 'class', implode( ' ', $classes ) );
			} else {
				$tags->remove_attribute( 'class' );
			}
		}

		return wp_slash( $tags->get_updated_html() );
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
				// Class is safe to allow: keep_alignment_classes() cuts it down after.
				'p'          => array( 'class' => true ),
				'blockquote' => array(
					'cite'  => true,
					'class' => true,
				),
				'br'         => array(),
				'pre'        => array(),
				'ul'         => array(),
				'ol'         => array(
					'start'    => true,
					'reversed' => true,
				),
				'li'         => array(),
			)
		);
	}

	/**
	 * The comment's HTML without the block delimiters, and without any block the editor does not offer.
	 *
	 * @param string $content Comment content.
	 * @return string
	 */
	public static function render( $content ) {
		if ( ! has_blocks( $content ) ) {
			return $content;
		}

		// With their attributes cleared, what is left of the delimiters is this shape alone.
		return (string) preg_replace( '#<!-- /?wp:[a-z0-9/-]+ /?-->#', '', serialize_blocks( self::allowed( parse_blocks( $content ) ) ) );
	}

	/**
	 * Whether the edit-comment screen is open on a comment that holds blocks.
	 *
	 * @return bool
	 */
	private static function is_editing_blocks() {
		global $pagenow;

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- which comment the screen shows, read only.
		$comment = 'comment.php' === $pagenow && isset( $_GET['c'] ) ? get_comment( absint( $_GET['c'] ) ) : null;

		return $comment instanceof \WP_Comment && has_blocks( $comment->comment_content );
	}

	/**
	 * A bare textarea for the editor to take over, in place of TinyMCE and quicktags.
	 *
	 * @param array  $settings  Editor settings.
	 * @param string $editor_id The editor's id.
	 * @return array
	 */
	public static function plain_editor( $settings, $editor_id ) {
		if ( 'content' === $editor_id && self::is_editing_blocks() ) {
			$settings['tinymce']   = false;
			$settings['quicktags'] = false;
		}

		return $settings;
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

		$labels = array(
			'blockTools' => __( 'Block tools', 'jetpack-comments' ),
		);

		wp_add_inline_script(
			'jetpack-comments-admin',
			'window.jetpackCommentsEditorLocale = ' . wp_json_encode( self::locale_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';'
				. 'window.jetpackCommentsEditorLabels = ' . wp_json_encode( $labels, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'before'
		);
	}

	/**
	 * The allowed blocks, at every depth.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array
	 */
	private static function allowed( array $blocks ) {
		$kept = array();

		foreach ( $blocks as $block ) {
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

				$child = self::allowed( array( array_shift( $inner ) ) );
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
