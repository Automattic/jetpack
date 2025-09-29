<?php
/**
 * Main plugin class for Media Editor.
 *
 * @package automattic/media-editor
 */

/**
 * Main plugin class.
 */
class Media_Editor {

	/**
	 * Plugin instance.
	 *
	 * @var Media_Editor
	 */
	private static $instance = null;

	/**
	 * Get the plugin instance.
	 *
	 * @return Media_Editor
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'load_textdomain' ) );
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_filter( 'media_row_actions', array( $this, 'add_media_row_actions' ), 10, 2 );
	}

	/**
	 * Load plugin textdomain.
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			'media-editor',
			false,
			dirname( plugin_basename( MEDIA_EDITOR_PLUGIN_FILE ) ) . '/languages'
		);
	}

	/**
	 * Add media row actions for direct access to media editor.
	 *
	 * @param array   $actions Media row actions.
	 * @param WP_Post $post    Media post object.
	 * @return array Modified actions.
	 */
	public function add_media_row_actions( $actions, $post ) {
		if ( wp_attachment_is_image( $post ) ) {
			$edit_url = admin_url( 'admin.php?page=media-editor&attachment_id=' . $post->ID );
			$actions['media_editor'] = sprintf(
				'<a href="%s">%s</a>',
				esc_url( $edit_url ),
				esc_html__( 'Media Editor', 'media-editor' )
			);
		}
		return $actions;
	}

	/**
	 * Add hidden admin menu page for media editor.
	 */
	public function add_admin_menu() {
		add_submenu_page(
			null, // Hidden from menu
			__( 'AI Media Editor', 'media-editor' ),
			__( 'AI Media Editor', 'media-editor' ),
			'upload_files',
			'media-editor',
			array( $this, 'render_media_editor_page' )
		);
	}

	/**
	 * Enqueue admin scripts and styles.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 */
	public function enqueue_admin_scripts( $hook_suffix ) {
		// Only load on our media editor page.
		if ( 'admin_page_media-editor' !== $hook_suffix ) {
			return;
		}

		// Enqueue WordPress dependencies.
		wp_enqueue_script( 'wp-element' );
		wp_enqueue_script( 'wp-components' );
		wp_enqueue_script( 'wp-data' );
		wp_enqueue_script( 'wp-core-data' );
		wp_enqueue_script( 'wp-notices' );
		wp_enqueue_script( 'wp-i18n' );

		// Register our media editor script.
		$asset_file = MEDIA_EDITOR_PLUGIN_DIR . 'build/index.asset.php';
		$asset_data = file_exists( $asset_file ) ? require $asset_file : array(
			'dependencies' => array(),
			'version'      => MEDIA_EDITOR_VERSION,
		);

		// Filter out react-jsx-runtime as it's included in wp-element
		$dependencies = array_filter( $asset_data['dependencies'], function( $dep ) {
			return $dep !== 'react-jsx-runtime';
		} );

		wp_register_script(
			'jetpack-media-editor',
			MEDIA_EDITOR_PLUGIN_URL . 'build/index.js',
			$dependencies,
			$asset_data['version'],
			true
		);

		// Enqueue styles.
		wp_enqueue_style(
			'jetpack-media-editor',
			MEDIA_EDITOR_PLUGIN_URL . 'build/index.css',
			array( 'wp-components' ),
			$asset_data['version']
		);

		// Only enqueue script on the media editor page.
		if ( 'admin_page_media-editor' === $hook_suffix || 'toplevel_page_media-editor-test' === $hook_suffix ) {
			wp_enqueue_script( 'jetpack-media-editor' );

			// Localize script with attachment data if available.
			$attachment_id = isset( $_GET['attachment_id'] ) ? intval( $_GET['attachment_id'] ) : 0;
			if ( $attachment_id ) {
				$attachment = get_post( $attachment_id );
				if ( $attachment && 'attachment' === $attachment->post_type ) {
					wp_localize_script(
						'jetpack-media-editor',
						'mediaEditor',
						array(
							'attachmentId' => $attachment_id,
							'apiRoot'      => esc_url_raw( rest_url() ),
							'nonce'        => wp_create_nonce( 'wp_rest' ),
							'agenttic'     => array(
								'enabled'    => true,
								'apiUrl'     => esc_url_raw( rest_url( 'jetpack/v4/ai-assistant/' ) ),
								'siteId'     => defined( 'JETPACK__WPCOM_JSON_API_BASE' ) ? Jetpack_Options::get_option( 'id' ) : null,
							),
						)
					);
				}
			}
		}
	}

	/**
	 * Render the media editor page.
	 */
	public function render_media_editor_page() {
		$attachment_id = isset( $_GET['attachment_id'] ) ? intval( $_GET['attachment_id'] ) : 0;

		if ( ! $attachment_id ) {
			wp_die( esc_html__( 'No attachment specified.', 'media-editor' ) );
		}

		$attachment = get_post( $attachment_id );
		if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
			wp_die( esc_html__( 'Invalid attachment.', 'media-editor' ) );
		}

		if ( ! current_user_can( 'edit_post', $attachment_id ) ) {
			wp_die( esc_html__( 'You do not have permission to edit this attachment.', 'media-editor' ) );
		}

		?>
		<div class="wrap">
			<div id="media-editor-root"></div>
		</div>
		<?php
	}
}