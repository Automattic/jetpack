<?php
/**
 * Form_Preview class.
 *
 * Handles form preview functionality for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Post;

/**
 * Handles form preview rendering with nonce-based authentication.
 */
class Form_Preview {

	/**
	 * The nonce action prefix for form preview.
	 *
	 * @var string
	 */
	const PREVIEW_NONCE_ACTION = 'jetpack_form_preview_';

	/**
	 * The query variable for form preview.
	 *
	 * @var string
	 */
	const PREVIEW_QUERY_VAR = 'jetpack_form_preview';

	/**
	 * The query variable for preview nonce.
	 *
	 * @var string
	 */
	const PREVIEW_NONCE_QUERY_VAR = 'preview_nonce';

	/**
	 * Flag to track if we're in preview mode.
	 *
	 * @var bool
	 */
	private static $is_preview_mode = false;

	/**
	 * Initialize the form preview handler.
	 */
	public static function init() {
		add_filter( 'query_vars', array( __CLASS__, 'register_query_vars' ) );
		add_filter( 'template_include', array( __CLASS__, 'maybe_render_preview' ), 99 );
		add_filter( 'jetpack_is_frontend', array( __CLASS__, 'filter_is_frontend' ) );
	}

	/**
	 * Filter jetpack_is_frontend to return true during preview mode.
	 *
	 * This ensures the form block renders properly instead of showing a fallback.
	 *
	 * @param bool $is_frontend Whether the current request is for the frontend.
	 * @return bool True if in preview mode, otherwise the original value.
	 */
	public static function filter_is_frontend( $is_frontend ) {
		if ( self::$is_preview_mode ) {
			return true;
		}
		return $is_frontend;
	}

	/**
	 * Register custom query variables.
	 *
	 * @param array $vars Existing query variables.
	 * @return array Modified query variables.
	 */
	public static function register_query_vars( $vars ) {
		$vars[] = self::PREVIEW_QUERY_VAR;
		$vars[] = self::PREVIEW_NONCE_QUERY_VAR;
		return $vars;
	}

	/**
	 * Check if we're currently in preview mode.
	 *
	 * @return bool True if in preview mode, false otherwise.
	 */
	public static function is_preview_mode() {
		return self::$is_preview_mode;
	}

	/**
	 * Generate a preview URL for a form.
	 *
	 * @param int $form_id The form post ID.
	 * @return string|null The preview URL, or null if generation fails.
	 */
	public static function generate_preview_url( $form_id ) {
		$form_id = absint( $form_id );

		// Validate form exists.
		$form = get_post( $form_id );
		if ( ! $form || Contact_Form::POST_TYPE !== $form->post_type ) {
			return null;
		}

		// Check user can edit this form.
		if ( ! current_user_can( 'edit_post', $form_id ) ) {
			return null;
		}

		// Generate nonce for this form.
		$nonce = wp_create_nonce( self::PREVIEW_NONCE_ACTION . $form_id );

		// Build preview URL.
		$preview_url = add_query_arg(
			array(
				self::PREVIEW_QUERY_VAR       => $form_id,
				self::PREVIEW_NONCE_QUERY_VAR => $nonce,
			),
			home_url( '/' )
		);

		return $preview_url;
	}

	/**
	 * Verify preview access for a form.
	 *
	 * @param int    $form_id The form post ID.
	 * @param string $nonce   The preview nonce.
	 * @return bool True if access is verified, false otherwise.
	 */
	public static function verify_preview_access( $form_id, $nonce ) {
		// Must be logged in.
		if ( ! is_user_logged_in() ) {
			return false;
		}

		// Must have edit capability for this form.
		if ( ! current_user_can( 'edit_post', $form_id ) ) {
			return false;
		}

		// Verify nonce.
		if ( ! wp_verify_nonce( $nonce, self::PREVIEW_NONCE_ACTION . $form_id ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Maybe render a form preview.
	 *
	 * @param string $template The template to include.
	 * @return string The template to include (potentially modified).
	 */
	public static function maybe_render_preview( $template ) {
		global $wp_query;

		// Get form_id and nonce from query vars.
		$form_id = get_query_var( self::PREVIEW_QUERY_VAR );
		$nonce   = get_query_var( self::PREVIEW_NONCE_QUERY_VAR );

		// If not a preview request, return template unchanged.
		if ( empty( $form_id ) || empty( $nonce ) ) {
			return $template;
		}

		$form_id = absint( $form_id );

		// Verify access.
		if ( ! self::verify_preview_access( $form_id, $nonce ) ) {
			wp_die(
				esc_html__( 'You do not have permission to preview this form.', 'jetpack-forms' ),
				esc_html__( 'Access Denied', 'jetpack-forms' ),
				array( 'response' => 403 )
			);
		}

		// Get the form post.
		$form = get_post( $form_id );
		if ( ! $form || Contact_Form::POST_TYPE !== $form->post_type ) {
			wp_die(
				esc_html__( 'Form not found.', 'jetpack-forms' ),
				esc_html__( 'Not Found', 'jetpack-forms' ),
				array( 'response' => 404 )
			);
		}

		// Check for autosave and use its content if available.
		// This ensures the preview shows the latest unsaved changes.
		$autosave = wp_get_post_autosave( $form_id, get_current_user_id() );
		if ( $autosave && strtotime( $autosave->post_modified ) > strtotime( $form->post_modified ) ) {
			$form = $autosave;
		}

		// Set preview mode flag.
		self::$is_preview_mode = true;

		// "bare" variant: render only the form itself, without theme chrome. Used by
		// the Classic Editor inline preview so it sees a standalone form inside its iframe.
		// Nonce / capability already verified above.
		if ( ! empty( $_GET['bare'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			self::render_bare_preview( $form );
		}

		// Set up fake page query context.
		$wp_query->is_page     = true;
		$wp_query->is_singular = true;
		$wp_query->is_home     = false;
		$wp_query->is_archive  = false;
		$wp_query->is_category = false;
		$wp_query->is_404      = false;
		$wp_query->is_feed     = false;

		// Create a fake post object for the page.
		// Use the form's ID as the fake post ID to ensure proper form context.
		// Note: Using 0 as the ID causes issues because '0' is falsy in PHP,
		// which breaks the form ID validation in Contact_Form::parse().
		$fake_post                = new \stdClass();
		$fake_post->ID            = $form_id;
		$fake_post->post_author   = get_current_user_id();
		$fake_post->post_date     = current_time( 'mysql' );
		$fake_post->post_date_gmt = current_time( 'mysql', true );
		$fake_post->post_title    = sprintf(
			/* translators: %s: Form title */
			__( 'Preview: %s', 'jetpack-forms' ),
			$form->post_title ? $form->post_title : __( 'Untitled Form', 'jetpack-forms' )
		);
		$fake_post->post_content   = '';
		$fake_post->post_status    = 'publish';
		$fake_post->comment_status = 'closed';
		$fake_post->ping_status    = 'closed';
		$fake_post->post_name      = 'form-preview';
		$fake_post->post_type      = 'page';
		$fake_post->filter         = 'raw';

		// Set up query vars.
		$wp_query->post              = new WP_Post( $fake_post );
		$wp_query->posts             = array( $wp_query->post );
		$wp_query->post_count        = 1;
		$wp_query->found_posts       = 1;
		$wp_query->max_num_pages     = 1;
		$wp_query->queried_object    = $wp_query->post;
		$wp_query->queried_object_id = $form_id;
		$GLOBALS['post']             = $wp_query->post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Necessary to set up fake post context for preview.

		// Enqueue preview styles.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_preview_styles' ) );

		// Add preview mode script variable.
		add_action( 'wp_head', array( __CLASS__, 'add_preview_mode_script' ) );

		// Hook the_content filter to render the form.
		add_filter(
			'the_content',
			function ( $_content ) use ( $form ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- We replace the content entirely.
				return self::render_form_preview_content( $form );
			},
			999
		);

		// Hook the_title filter to show preview title.
		add_filter(
			'the_title',
			function ( $title, $id = null ) use ( $form, $form_id ) {
				if ( $id === $form_id || ( isset( $GLOBALS['post'] ) && $GLOBALS['post']->ID === $form_id ) ) {
					return sprintf(
					/* translators: %s: Form title */
						__( 'Preview: %s', 'jetpack-forms' ),
						$form->post_title ? $form->post_title : __( 'Untitled Form', 'jetpack-forms' )
					);
				}
				return $title;
			},
			10,
			2
		);

		// Use page template.
		$page_template = get_page_template();
		if ( $page_template ) {
			return $page_template;
		}

		// Fallback to singular, index, or original template.
		$singular_template = get_singular_template();
		if ( $singular_template ) {
			return $singular_template;
		}

		$index_template = get_index_template();
		if ( $index_template ) {
			return $index_template;
		}

		return $template;
	}

	/**
	 * Render a "bare" form preview — no theme, no page chrome. Outputs a minimal
	 * HTML document containing only the rendered form blocks and exits.
	 *
	 * Callers must have already verified access (nonce + capability).
	 *
	 * @param WP_Post $form The form post to render.
	 * @return void
	 */
	private static function render_bare_preview( WP_Post $form ) {
		// Render blocks first so any block-registered styles/scripts get enqueued
		// before <head> / <footer> print. This mirrors how the frontend renders
		// the form so every block (image-select, rating, etc.) contributes its
		// own stylesheet and view script naturally.
		self::$is_preview_mode = true;
		ob_start();
		foreach ( parse_blocks( $form->post_content ) as $block ) {
			echo render_block( $block ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- render_block returns rendered HTML.
		}
		$rendered_form = (string) ob_get_clean();

		// Form frontend stylesheet.
		wp_enqueue_style( 'grunion.css' );
		self::enqueue_preview_styles();

		status_header( 200 );
		nocache_headers();
		header( 'Content-Type: text/html; charset=' . get_bloginfo( 'charset' ) );

		?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html__( 'Form preview', 'jetpack-forms' ); ?></title>
		<?php
		// Print everything wp_head would: registered styles (block styles, theme
		// global styles via theme.json, the form's frontend CSS) and early scripts.
		// Don't call wp_head() directly so we skip theme <head> injections we don't
		// want (favicons, generator meta, SEO plugins, etc.).
		wp_print_styles();
		wp_custom_css_cb();
		if ( function_exists( 'wp_print_font_faces' ) ) {
			wp_print_font_faces();
		}
		if ( function_exists( 'wp_enqueue_global_styles' ) ) {
			wp_enqueue_global_styles();
			wp_print_styles();
		}
		?>
	<style>
		html, body { margin: 0; padding: 0; background: #fff; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
			padding: 16px;
			color: #1d2327;
			box-sizing: border-box;
		}
		/* Form should fill the preview iframe — ignore theme contentSize limits
			and any user-set border on the form block. */
		body.jetpack-form-bare-preview .wp-block-jetpack-contact-form,
		body.jetpack-form-bare-preview .contact-form {
			max-width: none !important;
			width: 100%;
			margin-left: 0;
			margin-right: 0;
			border: 0 !important;
			box-shadow: none !important;
		}
		/* Fallback submit-button styling — classic themes (no theme.json) leave
			wp-element-button unstyled and the browser paints its default 2px
			outset. :where() keeps specificity at 0 so block themes' global
			styles always win. */
		:where(
			body.jetpack-form-bare-preview .wp-block-button__link,
			body.jetpack-form-bare-preview .wp-element-button,
			body.jetpack-form-bare-preview button[type="submit"]
		) {
			background-color: #1e1e1e;
			color: #fff;
			border: 0;
			border-radius: 2px;
			padding: 0.667em 1.333em;
			line-height: 1.2;
			text-decoration: none;
			cursor: default;
		}
		/* Preview only — disable interaction. */
		body.jetpack-form-bare-preview form,
		body.jetpack-form-bare-preview input,
		body.jetpack-form-bare-preview textarea,
		body.jetpack-form-bare-preview select,
		body.jetpack-form-bare-preview button {
			pointer-events: none;
		}
	</style>
</head>
<body class="jetpack-form-bare-preview">
		<?php echo $rendered_form; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already-rendered block HTML. ?>
		<?php
		// Print any block-registered footer styles/scripts (e.g. view scripts for
		// interactive fields like image-select, rating).
		wp_print_footer_scripts();
		?>
</body>
</html>
		<?php
		exit;
	}

	/**
	 * Render the form preview content.
	 *
	 * @param WP_Post|null $form The form post.
	 * @return string The rendered content.
	 */
	private static function render_form_preview_content( ?WP_Post $form ) {
		if ( ! $form ) {
			return '';
		}

		$output = '';

		// Add preview banner.
		$output .= '<div class="jetpack-form-preview-banner">';
		$output .= esc_html__( 'This is a preview. Form submissions are disabled.', 'jetpack-forms' );
		$output .= '</div>';

		// Parse and render the form blocks.
		$blocks = parse_blocks( $form->post_content );

		foreach ( $blocks as $block ) {
			$output .= render_block( $block );
		}

		return $output;
	}

	/**
	 * Enqueue preview styles.
	 */
	public static function enqueue_preview_styles() {
		$css_file = __DIR__ . '/css/form-preview.css';
		$version  = file_exists( $css_file ) ? (string) filemtime( $css_file ) : \Automattic\Jetpack\Forms\Jetpack_Forms::PACKAGE_VERSION;

		wp_enqueue_style(
			'jetpack-form-preview',
			plugins_url( 'css/form-preview.css', __FILE__ ),
			array(),
			$version
		);
	}

	/**
	 * Add preview mode script variable.
	 */
	public static function add_preview_mode_script() {
		wp_print_inline_script_tag( 'window.jetpackFormsPreviewMode = true;' );
	}
}
