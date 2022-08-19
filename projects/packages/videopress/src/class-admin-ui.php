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

		add_action( 'admin_footer-upload.php', array( __CLASS__, 'attachment_details_template' ) );

		add_filter( 'get_edit_post_link', array( __CLASS__, 'edit_video_link' ), 10, 3 );
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

	/**
	 * Overwrites the backbone template for the attachment details modal
	 *
	 * This template is originally added in WP core in wp-includes/media-templates.php
	 *
	 * All modifications to the original template are wrapped around PHP comments saying "VIDEOPRESS CUSTOMIZATION"
	 *
	 * @return void
	 */
	public static function attachment_details_template() {
		// phpcs:disable WordPress.Security.EscapeOutput.UnsafePrintingFunction
		// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped

		$alt_text_description = sprintf(
			/* translators: 1: Link to tutorial, 2: Additional link attributes, 3: Accessibility text. */
			__( '<a href="%1$s" %2$s>Learn how to describe the purpose of the image%3$s</a>. Leave empty if the image is purely decorative.', 'jetpack-videopress-pkg' ),
			esc_url( 'https://www.w3.org/WAI/tutorials/images/decision-tree' ),
			'target="_blank" rel="noopener"',
			sprintf(
				'<span class="screen-reader-text"> %s</span>',
				/* translators: Accessibility text. */
				__( '(opens in a new tab)', 'jetpack-videopress-pkg' )
			)
		);

		?>
		<script type="text/html" id="tmpl-attachment-details-two-column-videopress">
			<div class="attachment-media-view {{ data.orientation }}">
				<h2 class="screen-reader-text"><?php _e( 'Attachment Preview', 'jetpack-videopress-pkg' ); ?></h2>
				<div class="thumbnail thumbnail-{{ data.type }}">
					<# if ( data.uploading ) { #>
						<div class="media-progress-bar"><div></div></div>
					<# } else if ( data.sizes && data.sizes.large ) { #>
						<img class="details-image" src="{{ data.sizes.large.url }}" draggable="false" alt="" />
					<# } else if ( data.sizes && data.sizes.full ) { #>
						<img class="details-image" src="{{ data.sizes.full.url }}" draggable="false" alt="" />
					<# } else if ( -1 === jQuery.inArray( data.type, [ 'audio', 'video' ] ) ) { #>
						<img class="details-image icon" src="{{ data.icon }}" draggable="false" alt="" />
					<# } #>

					<# if ( 'audio' === data.type ) { #>
					<div class="wp-media-wrapper wp-audio">
						<audio style="visibility: hidden" controls class="wp-audio-shortcode" width="100%" preload="none">
							<source type="{{ data.mime }}" src="{{ data.url }}" />
						</audio>
					</div>
					<# } else if ( 'video' === data.type ) {
						var w_rule = '';
						if ( data.width ) {
							w_rule = 'width: ' + data.width + 'px;';
						} else if ( wp.media.view.settings.contentWidth ) {
							w_rule = 'width: ' + wp.media.view.settings.contentWidth + 'px;';
						}
					#>
					<div style="{{ w_rule }}" class="wp-media-wrapper wp-video">
						<video controls="controls" class="wp-video-shortcode" preload="metadata"
							<# if ( data.width ) { #>width="{{ data.width }}"<# } #>
							<# if ( data.height ) { #>height="{{ data.height }}"<# } #>
							<# if ( data.image && data.image.src !== data.icon ) { #>poster="{{ data.image.src }}"<# } #>>
							<source type="{{ data.mime }}" src="{{ data.url }}" />
						</video>
					</div>
					<# } #>
					<div class="attachment-actions">
						<# if ( 'image' === data.type && ! data.uploading && data.sizes && data.can.save ) { #>
						<button type="button" class="button edit-attachment"><?php _e( 'Edit Image', 'jetpack-videopress-pkg' ); ?></button>
						<# } else if ( 'pdf' === data.subtype && data.sizes ) { #>
						<p><?php _e( 'Document Preview', 'jetpack-videopress-pkg' ); ?></p>
						<# } #>
					</div>
				</div>
			</div>
			<div class="attachment-info">
			<?php // VIDEOPRESS CUSTOMIZATION START ?>
			<# if ( 'video' === data.type && 'videopress' === data.subtype ) { #>
				<h2>VideoPress</h2>
				<div class="filename"><strong><?php _e( 'File name:', 'jetpack-videopress-pkg' ); ?></strong> {{ data.filename }}</div>
				<p>To do: Add read-only data about the video here.</p>
				<p><a href="{{ data.editLink }}">Edit video details</a></p>
			<# } else { #>
			<?php // VIDEOPRESS CUSTOMIZATION END ?>
					<span class="settings-save-status" role="status">
							<span class="spinner"></span>
							<span class="saved"><?php esc_html_e( 'Saved.', 'jetpack-videopress-pkg' ); ?></span>
					</span>
					<div class="details">
						<h2 class="screen-reader-text"><?php _e( 'Details', 'jetpack-videopress-pkg' ); ?></h2>
						<div class="uploaded"><strong><?php _e( 'Uploaded on:', 'jetpack-videopress-pkg' ); ?></strong> {{ data.dateFormatted }}</div>
						<div class="uploaded-by">
							<strong><?php _e( 'Uploaded by:', 'jetpack-videopress-pkg' ); ?></strong>
								<# if ( data.authorLink ) { #>
									<a href="{{ data.authorLink }}">{{ data.authorName }}</a>
								<# } else { #>
									{{ data.authorName }}
								<# } #>
						</div>
						<# if ( data.uploadedToTitle ) { #>
							<div class="uploaded-to">
								<strong><?php _e( 'Uploaded to:', 'jetpack-videopress-pkg' ); ?></strong>
								<# if ( data.uploadedToLink ) { #>
									<a href="{{ data.uploadedToLink }}">{{ data.uploadedToTitle }}</a>
								<# } else { #>
									{{ data.uploadedToTitle }}
								<# } #>
							</div>
						<# } #>
						<div class="filename"><strong><?php _e( 'File name:', 'jetpack-videopress-pkg' ); ?></strong> {{ data.filename }}</div>
						<div class="file-type"><strong><?php _e( 'File type:', 'jetpack-videopress-pkg' ); ?></strong> {{ data.mime }}</div>
						<div class="file-size"><strong><?php _e( 'File size:', 'jetpack-videopress-pkg' ); ?></strong> {{ data.filesizeHumanReadable }}</div>
						<# if ( 'image' === data.type && ! data.uploading ) { #>
							<# if ( data.width && data.height ) { #>
								<div class="dimensions"><strong><?php _e( 'Dimensions:', 'jetpack-videopress-pkg' ); ?></strong>
									<?php
									/* translators: 1: A number of pixels wide, 2: A number of pixels tall. */
									printf( __( '%1$s by %2$s pixels', 'jetpack-videopress-pkg' ), '{{ data.width }}', '{{ data.height }}' );
									?>
								</div>
							<# } #>

							<# if ( data.originalImageURL && data.originalImageName ) { #>
								<?php _e( 'Original image:', 'jetpack-videopress-pkg' ); ?>
								<a href="{{ data.originalImageURL }}">{{data.originalImageName}}</a>
							<# } #>
						<# } #>

						<# if ( data.fileLength && data.fileLengthHumanReadable ) { #>
							<div class="file-length"><strong><?php _e( 'Length:', 'jetpack-videopress-pkg' ); ?></strong>
								<span aria-hidden="true">{{ data.fileLength }}</span>
								<span class="screen-reader-text">{{ data.fileLengthHumanReadable }}</span>
							</div>
						<# } #>

						<# if ( 'audio' === data.type && data.meta.bitrate ) { #>
							<div class="bitrate">
								<strong><?php _e( 'Bitrate:', 'jetpack-videopress-pkg' ); ?></strong> {{ Math.round( data.meta.bitrate / 1000 ) }}kb/s
								<# if ( data.meta.bitrate_mode ) { #>
								{{ ' ' + data.meta.bitrate_mode.toUpperCase() }}
								<# } #>
							</div>
						<# } #>

						<# if ( data.mediaStates ) { #>
							<div class="media-states"><strong><?php _e( 'Used as:', 'jetpack-videopress-pkg' ); ?></strong> {{ data.mediaStates }}</div>
						<# } #>

						<div class="compat-meta">
							<# if ( data.compat && data.compat.meta ) { #>
								{{{ data.compat.meta }}}
							<# } #>
						</div>
					</div>

					<div class="settings">
						<# var maybeReadOnly = data.can.save || data.allowLocalEdits ? '' : 'readonly'; #>
						<# if ( 'image' === data.type ) { #>
							<span class="setting has-description" data-setting="alt">
								<label for="attachment-details-two-column-alt-text" class="name"><?php _e( 'Alternative Text', 'jetpack-videopress-pkg' ); ?></label>
								<input type="text" id="attachment-details-two-column-alt-text" value="{{ data.alt }}" aria-describedby="alt-text-description" {{ maybeReadOnly }} />
							</span>
							<p class="description" id="alt-text-description"><?php echo $alt_text_description; ?></p>
						<# } #>
						<?php if ( post_type_supports( 'attachment', 'title' ) ) : ?>
						<span class="setting" data-setting="title">
							<label for="attachment-details-two-column-title" class="name"><?php _e( 'Title', 'jetpack-videopress-pkg' ); ?></label>
							<input type="text" id="attachment-details-two-column-title" value="{{ data.title }}" {{ maybeReadOnly }} />
						</span>
						<?php endif; ?>
						<# if ( 'audio' === data.type ) { #>
						<?php
						foreach ( array(
							'artist' => __( 'Artist', 'jetpack-videopress-pkg' ),
							'album'  => __( 'Album', 'jetpack-videopress-pkg' ),
						) as $key => $label ) :
							?>
						<span class="setting" data-setting="<?php echo esc_attr( $key ); ?>">
							<label for="attachment-details-two-column-<?php echo esc_attr( $key ); ?>" class="name"><?php echo $label; ?></label>
							<input type="text" id="attachment-details-two-column-<?php echo esc_attr( $key ); ?>" value="{{ data.<?php echo $key; ?> || data.meta.<?php echo $key; ?> || '' }}" />
						</span>
						<?php endforeach; ?>
						<# } #>
						<span class="setting" data-setting="caption">
							<label for="attachment-details-two-column-caption" class="name"><?php _e( 'Caption', 'jetpack-videopress-pkg' ); ?></label>
							<textarea id="attachment-details-two-column-caption" {{ maybeReadOnly }}>{{ data.caption }}</textarea>
						</span>
						<span class="setting" data-setting="description">
							<label for="attachment-details-two-column-description" class="name"><?php _e( 'Description', 'jetpack-videopress-pkg' ); ?></label>
							<textarea id="attachment-details-two-column-description" {{ maybeReadOnly }}>{{ data.description }}</textarea>
						</span>
						<span class="setting" data-setting="url">
							<label for="attachment-details-two-column-copy-link" class="name"><?php _e( 'File URL:', 'jetpack-videopress-pkg' ); ?></label>
							<input type="text" class="attachment-details-copy-link" id="attachment-details-two-column-copy-link" value="{{ data.url }}" readonly />
							<span class="copy-to-clipboard-container">
								<button type="button" class="button button-small copy-attachment-url" data-clipboard-target="#attachment-details-two-column-copy-link"><?php _e( 'Copy URL to clipboard', 'jetpack-videopress-pkg' ); ?></button>
								<span class="success hidden" aria-hidden="true"><?php _e( 'Copied!', 'jetpack-videopress-pkg' ); ?></span>
							</span>
						</span>
						<div class="attachment-compat"></div>
					</div>

					<div class="actions">
						<# if ( data.link ) { #>
							<a class="view-attachment" href="{{ data.link }}"><?php _e( 'View attachment page', 'jetpack-videopress-pkg' ); ?></a>
						<# } #>
						<# if ( data.can.save ) { #>
							<# if ( data.link ) { #>
								<span class="links-separator">|</span>
							<# } #>
							<a href="{{ data.editLink }}"><?php _e( 'Edit more details', 'jetpack-videopress-pkg' ); ?></a>
						<# } #>
						<# if ( ! data.uploading && data.can.remove ) { #>
							<# if ( data.link || data.can.save ) { #>
								<span class="links-separator">|</span>
							<# } #>
							<?php if ( MEDIA_TRASH ) : ?>
								<# if ( 'trash' === data.status ) { #>
									<button type="button" class="button-link untrash-attachment"><?php _e( 'Restore from Trash', 'jetpack-videopress-pkg' ); ?></button>
								<# } else { #>
									<button type="button" class="button-link trash-attachment"><?php _e( 'Move to Trash', 'jetpack-videopress-pkg' ); ?></button>
								<# } #>
							<?php else : ?>
								<button type="button" class="button-link delete-attachment"><?php _e( 'Delete permanently', 'jetpack-videopress-pkg' ); ?></button>
							<?php endif; ?>
						<# } #>
					</div>
				<?php // VIDEOPRESS CUSTOMIZATION START ?>
				<# } #>
				<?php // VIDEOPRESS CUSTOMIZATION END ?>
			</div>
		</script>
		<script>
			jQuery(document).ready( function($) {
				if( typeof wp.media.view.Attachment.Details != 'undefined' ){
					wp.media.view.Attachment.Details.TwoColumn.prototype.template = wp.template( 'attachment-details-two-column-videopress' );
				}
			});
		</script>
		<?php
		// phpcs:enable WordPress.Security.EscapeOutput.UnsafePrintingFunction
		// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
