<?php
/**
 * Media library on demand: the scripts and templates of wp_enqueue_media(), for a dashboard to load when it opens the library.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Serves the media library to `loadMediaLibrary()` in `@automattic/jetpack-components/tools/load-media-library`.
 */
class Media_Library {

	/**
	 * The admin-ajax action that returns the media library.
	 */
	const AJAX_ACTION = 'jetpack_media_library';

	/**
	 * The script and style handles wp_enqueue_media() enqueues. A fixed list: the function runs once per request, so a queue diff can come back empty.
	 */
	const HANDLES = array( 'media-editor', 'media-audiovideo', 'mce-view', 'image-edit', 'media-views', 'imgareaselect' );

	/**
	 * Whether init() has run.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook up the endpoint. admin-ajax never builds the admin menu, so callers outside it call this too.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;
		add_action( 'wp_ajax_' . self::AJAX_ACTION, array( __CLASS__, 'ajax_media_library' ) );
		// After core prints the late scripts and styles.
		add_action( 'admin_print_footer_scripts', array( Page_Handles::class, 'print_handles' ), 100 );
	}

	/**
	 * Send the media library's styles, scripts and templates.
	 *
	 * @return void
	 */
	public static function ajax_media_library() {
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_send_json_error( null, 403, JSON_UNESCAPED_SLASHES );
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only: they only leave out what the page already has.
		$done = array(
			'scripts' => isset( $_REQUEST['scripts'] ) && is_string( $_REQUEST['scripts'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['scripts'] ) ) : '',
			'styles'  => isset( $_REQUEST['styles'] ) && is_string( $_REQUEST['styles'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['styles'] ) ) : '',
		);
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		$html = self::get_html( array_filter( explode( ',', $done['scripts'] ) ), array_filter( explode( ',', $done['styles'] ) ) );
		wp_send_json_success( array( 'html' => $html ), 200, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * The media library's styles and scripts, with their dependencies, then its templates.
	 *
	 * @param string[] $done_scripts Script handles the page already has. Concatenated ones carry no id the client could skip.
	 * @param string[] $done_styles  Style handles the page already has.
	 * @return string
	 */
	public static function get_html( array $done_scripts = array(), array $done_styles = array() ) {
		// Notices from other plugins' wp_enqueue_media callbacks would break the JSON.
		ob_start();
		wp_enqueue_media();
		ob_end_clean();
		wp_scripts()->done = array_merge( wp_scripts()->done, $done_scripts );
		wp_styles()->done  = array_merge( wp_styles()->done, $done_styles );
		Page_Handles::print_one_tag_per_handle();
		ob_start();
		wp_print_styles( self::HANDLES );
		wp_print_scripts( self::HANDLES );
		// Core prints these on admin_footer. They come after the scripts, since a print_media_templates callback can read wp.media.
		wp_print_media_templates();
		return (string) ob_get_clean();
	}
}
