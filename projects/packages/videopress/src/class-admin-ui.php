<?php
/**
 * The initializer class for Admin UI elements
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;

/**
 * Initialized the VideoPress package
 */
class Admin_UI {

	const JETPACK_VIDEOPRESS_PKG_NAMESPACE = 'jetpack-videopress-pkg';

	/**
	 * Initializes the Admin UI of VideoPress
	 *
	 * This method is called only once by the Initializer class
	 *
	 * @return void
	 */
	public static function init() {
		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ),
			_x( 'VideoPress', 'The Jetpack VideoPress product name, without the Jetpack prefix', 'jetpack-videopress-pkg' ),
			'manage_options',
			'jetpack-videopress',
			array( __CLASS__, 'plugin_settings_page' ),
			99
		);
		add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );

		add_action( 'admin_footer-upload.php', array( __CLASS__, 'attachment_details_two_column_template' ) );
		add_action( 'admin_footer-post.php', array( __CLASS__, 'attachment_details_template' ) );

		add_filter( 'get_edit_post_link', array( __CLASS__, 'edit_video_link' ), 10, 3 );

		add_action( 'admin_init', array( __CLASS__, 'remove_jetpack_hooks' ) );

	}

	/**
	 * Initialize the admin resources.
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Main plugin settings page.
	 */
	public static function plugin_settings_page() {
		?>
			<div id="jetpack-videopress-root"></div>
		<?php
	}

	/**
	 * Remove extra fields from Attachment details modal
	 *
	 * @return void
	 */
	public static function remove_jetpack_hooks() {
		if ( class_exists( '\VideoPress_Edit_Attachment' ) ) {
			$edit_attachment = \VideoPress_Edit_Attachment::init();
			remove_filter( 'attachment_fields_to_edit', array( $edit_attachment, 'fields_to_edit' ) );
			remove_filter( 'attachment_fields_to_save', array( $edit_attachment, 'save_fields' ) );
		}
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public static function enqueue_admin_scripts() {
		Assets::register_script(
			self::JETPACK_VIDEOPRESS_PKG_NAMESPACE,
			'../build/admin/index.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-videopress-pkg',
			)
		);
		Assets::enqueue_script( self::JETPACK_VIDEOPRESS_PKG_NAMESPACE );

		// Initial JS state including JP Connection data.
		wp_add_inline_script( self::JETPACK_VIDEOPRESS_PKG_NAMESPACE, Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( self::JETPACK_VIDEOPRESS_PKG_NAMESPACE, self::render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public static function render_initial_state() {
		return 'var jetpackVideoPressInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( self::initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public static function initial_state() {
		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
		);
	}

	/**
	 * Replaces the edit link for videopress videos
	 *
	 * @param string $link - the post link.
	 * @param int    $post_id - the post ID.
	 * @param string $context - the context.
	 *
	 * @return string
	 */
	public static function edit_video_link( $link, $post_id, $context ) {
		$post_id = (int) $post_id;
		if ( ! $post_id ) {
			return $link;
		}

		$post = get_post( $post_id );
		if ( ! $post ) {
			return $link;
		}

		if ( 'attachment' !== $post->post_type || 'video/videopress' !== $post->post_mime_type ) {
			return $link;
		}

		$route = sprintf( '#/video/%d/edit', $post_id );
		$url   = admin_url( 'admin.php?page=jetpack-videopress' . $route );

		if ( 'display' === $context ) {
			return esc_url( $url );
		}

		return esc_url_raw( $url );
	}

	// phpcs:disable WordPress.Security.EscapeOutput.UnsafePrintingFunction
	// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped"

	/**
	 * Overwrites the backbone template for the attachment details modal
	 *
	 * This template is originally added in WP core in wp-includes/media-templates.php
	 *
	 * We override the initialize method of the TwoColumn view class (located at core's js/media/view/attachment/detail-two-column.js)
	 * and use the custom template only for VideoPress videos.
	 *
	 * @return void
	 */
	public static function attachment_details_two_column_template() {

		?>
		<script type="text/html" id="tmpl-attachment-details-two-column-videopress">
			<div class="attachment-media-view {{ data.orientation }}">
				<h2 class="screen-reader-text"><?php _e( 'Attachment Preview', 'jetpack-videopress-pkg' ); ?></h2>
				<div class="thumbnail thumbnail-{{ data.type }}">
				</div>
			</div>
			<div class="attachment-info">
				<h2><?php _e( 'Video Details', 'jetpack-videopress-pkg' ); ?></h2>
				<?php self::attachment_info_template_part(); ?>
			</div>
		</script>
		<script>
			jQuery(document).ready( function($) {
				if( typeof wp.media.view.Attachment.Details != 'undefined' ){
					wp.media.view.Attachment.Details.TwoColumn.prototype.initialize = function() {
						if ( 'video' === this.model.attributes.type && 'videopress' === this.model.attributes.subtype ) {
							this.template = wp.template( 'attachment-details-two-column-videopress' );
						} else {
							this.template = wp.template( 'attachment-details-two-column' );
						}
						// From this point on, we are just copying the function from core.
						this.controller.on( 'content:activate:edit-details', _.bind( this.editAttachment, this ) );
						wp.media.view.Attachment.Details.prototype.initialize.apply( this, arguments );
					}
				}
			});
		</script>
		<?php

	}

	/**
	 * Overwrites the backbone template for the attachment details modal
	 *
	 * This template is originally added in WP core in wp-includes/media-templates.php
	 *
	 * We override the initialize method of the TwoColumn view class (located at core's js/media/view/attachment/detail-two-column.js)
	 * and use the custom template only for VideoPress videos.
	 *
	 * @return void
	 */
	public static function attachment_details_template() {
		?>
		<script type="text/html" id="tmpl-attachment-details-videopress">
			<h2>
				<?php _e( 'Video Details', 'jetpack-videopress-pkg' ); ?>
				<span class="settings-save-status" role="status">
					<span class="spinner"></span>
					<span class="saved"><?php esc_html_e( 'Saved.', 'jetpack-videopress-pkg' ); ?></span>
				</span>
			</h2>
			<div class="attachment-info">
				<div class="wp-media-wrapper wp-video">
					<video controls="controls" class="wp-video-shortcode" preload="metadata"
						<# if ( data.width ) { #>width="{{ data.width }}"<# } #>
						<# if ( data.height ) { #>height="{{ data.height }}"<# } #>
						<# if ( data.image && data.image.src !== data.icon ) { #>poster="{{ data.image.src }}"<# } #>>
						<source type="{{ data.mime }}" src="{{ data.url }}" />
					</video>
				</div>
				<?php self::attachment_info_template_part(); ?>
			</div>
		</script>
		<script>
			jQuery(document).ready( function($) {
				if( typeof wp.media.view.Attachment.Details != 'undefined' ){
					wp.media.view.Attachment.Details.prototype.initialize = function() {
						if ( 'video' === this.model.attributes.type && 'videopress' === this.model.attributes.subtype ) {
							this.template = wp.template( 'attachment-details-videopress' );
						} else {
							this.template = wp.template( 'attachment-details' );
						}
						// From this point on, we are just copying the function from core.
						this.options = _.defaults( this.options, {
							rerenderOnModelChange: false
						});

						// Call 'initialize' directly on the parent class.
						wp.media.view.Attachment.prototype.initialize.apply( this, arguments );

						this.copyAttachmentDetailsURLClipboard();
					}
				}
			});
		</script>
		<?php

	}

	/**
	 * Echoes the piece of the custom template that is shared between the two templates above
	 *
	 * @return void
	 */
	protected static function attachment_info_template_part() {
		?>
		<span class="setting" data-setting="filename">
			<label for="attachment-details-filename" class="name"><?php _e( 'File name', 'jetpack-videopress-pkg' ); ?></label>
			<input type="text" id="attachment-details-filename" value="{{ data.filename }}" readonly />
		</span>
		<span class="setting" data-setting="fileurl">
			<label for="attachment-details-copy-link" class="name"><?php _e( 'File URL:', 'jetpack-videopress-pkg' ); ?></label>
			<input type="text" class="attachment-details-copy-link" id="attachment-details-copy-link" value="{{ data.url }}" readonly />
			<div class="copy-to-clipboard-container">
				<button type="button" class="button button-small copy-attachment-url" data-clipboard-target="#attachment-details-copy-link"><?php _e( 'Copy URL to clipboard', 'jetpack-videopress-pkg' ); ?></button>
				<span class="success hidden" aria-hidden="true"><?php _e( 'Copied!', 'jetpack-videopress-pkg' ); ?></span>
			</div>
		</span>
		<p><a href="{{ data.editLink }}" class="button button-medium" target="_blank"><?php _e( 'Edit video details', 'jetpack-videopress-pkg' ); ?></a></p>
		<?php
	}
	// phpcs:enable WordPress.Security.EscapeOutput.UnsafePrintingFunction
	// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped"
}
