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

	const I18N_ACTION = 'jetpack_comments_editor_i18n';

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
	 * Whether register_routes() has run.
	 *
	 * @var bool
	 */
	private static $routes_registered = false;

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
		self::register_routes();
	}

	/**
	 * Register the translations route. Safe to call more than once: jetpack-mu-wpcom calls it
	 * ahead of the gates that keep init() off admin-ajax on WordPress.com.
	 *
	 * @return void
	 */
	public static function register_routes() {
		if ( self::$routes_registered ) {
			return;
		}

		self::$routes_registered = true;

		// Admin-ajax, not REST: Simple sites have no /wp-json of their own.
		add_action( 'wp_ajax_' . self::I18N_ACTION, array( __CLASS__, 'send_locale_data' ) );
		add_action( 'wp_ajax_nopriv_' . self::I18N_ACTION, array( __CLASS__, 'send_locale_data' ) );
	}

	/**
	 * Where the comment form fetches the editor's translations from; empty in English.
	 *
	 * @return string
	 */
	public static function i18n_url() {
		if ( 'en_US' === determine_locale() ) {
			return '';
		}

		// Relative: on Simple, admin_url() is on the wordpress.com host. The locale and
		// version only key the cache.
		return wp_make_link_relative(
			add_query_arg(
				array(
					'action' => self::I18N_ACTION,
					'locale' => determine_locale(),
					'ver'    => get_bloginfo( 'version' ),
				),
				admin_url( 'admin-ajax.php' )
			)
		);
	}

	/**
	 * Core's translations for the scripts the editor bundles, in one Jed messages set.
	 *
	 * @return object
	 */
	private static function locale_data() {
		$messages = array();

		foreach ( array( 'wp-block-editor', 'wp-block-library', 'wp-blocks', 'wp-components', 'wp-format-library', 'wp-rich-text', 'wp-keycodes' ) as $handle ) {
			$json = load_script_textdomain( $handle, 'default' );
			$data = is_string( $json ) ? json_decode( $json, true ) : null;

			if ( isset( $data['locale_data']['messages'] ) && is_array( $data['locale_data']['messages'] ) ) {
				$messages += $data['locale_data']['messages'];
			}
		}

		return (object) $messages;
	}

	/**
	 * Answer the comment form's request for the editor's translations.
	 *
	 * @return void
	 */
	public static function send_locale_data() {
		// Registered on every WordPress.com request, so it gates itself as the form does.
		if ( ! Comments::is_enabled() || ! self::is_enabled() ) {
			wp_send_json( null, 404, JSON_UNESCAPED_SLASHES );
		}

		header( 'Cache-Control: public, max-age=' . DAY_IN_SECONDS );
		wp_send_json( self::locale_data(), 200, JSON_UNESCAPED_SLASHES );
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
			'blockTools'  => __( 'Block tools', 'jetpack-comments' ),
			'formatTools' => __( 'Format tools', 'jetpack-comments' ),
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
