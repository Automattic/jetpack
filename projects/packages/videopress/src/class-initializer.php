<?php
/**
 * The initializer class for the videopress package
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Initialized the VideoPress package
 */
class Initializer {

	const JETPACK_VIDEOPRESS_IFRAME_API_HANDLER = 'jetpack-videopress-iframe-api';

	/**
	 * Initialization optinos
	 *
	 * @var array
	 */
	protected static $init_options = array();

	/**
	 * Initializes the VideoPress package
	 *
	 * This method is called by Config::ensure.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! did_action( 'videopress_init' ) ) {

			self::unconditional_initialization();

			if ( Status::is_active() ) {
				self::active_initialization();
			} elseif ( self::should_initialize_admin_ui() ) {
				// Keep "Jetpack > VideoPress" in the menu when the module is not
				// active, linking to the My Jetpack interstitial to activate it.
				Admin_UI::init_inactive_menu();
			}
		}

		/**
		 * Fires after the VideoPress package is initialized
		 *
		 * @since 0.1.1
		 */
		do_action( 'videopress_init' );
	}

	/**
	 * Update the initialization options
	 *
	 * This method is called by the Config class
	 *
	 * @param array $options The initialization options.
	 * @return void
	 */
	public static function update_init_options( array $options ) {
		if ( empty( $options['admin_ui'] ) || self::should_initialize_admin_ui() ) { // do not overwrite if already set to true.
			return;
		}

		self::$init_options['admin_ui'] = $options['admin_ui'];
	}

	/**
	 * Checks the initialization options and returns whether the admin_ui should be initialized or not
	 *
	 * @return boolean
	 */
	public static function should_initialize_admin_ui() {
		return isset( self::$init_options['admin_ui'] ) && true === self::$init_options['admin_ui'];
	}

	/**
	 * Initialize VideoPress features that should be initialized whenever VideoPress is present, even if the module is not active
	 *
	 * @return void
	 */
	private static function unconditional_initialization() {
		if ( self::should_include_utilities() ) {
			require_once __DIR__ . '/utility-functions.php';
		}

		// Set up package version hook.
		add_filter( 'jetpack_package_versions', __NAMESPACE__ . '\Package_Version::send_package_version_to_tracker' );

		/*
		 * Keep the videopress_guid attachment meta out of reach of the
		 * user-facing meta write APIs (Custom Fields, XML-RPC set_custom_fields,
		 * the WordPress.com JSON API metadata op, REST). The post <-> guid
		 * mapping is what the VideoPress meta and poster endpoints authorize
		 * against, so a writable guid would let a caller point an object they
		 * can edit at somebody else's video and still pass the edit_post check.
		 *
		 * These auth_* filters are consulted by map_meta_cap() for the
		 * add/edit/delete_post_meta capabilities only, so unlike marking the key
		 * protected they leave is_protected_meta() false and meta_key queries
		 * against the WordPress.com JSON API keep working. VideoPress writes the
		 * mapping itself with update_post_meta(), which does not consult
		 * capabilities, so uploads and transcoding are unaffected.
		 *
		 * The subtype-specific filter covers attachments; the generic one covers
		 * calls made before a subtype can be resolved.
		 */
		add_filter( 'auth_post_meta_videopress_guid_for_attachment', '__return_false' );
		add_filter( 'auth_post_meta_videopress_guid', '__return_false' );

		Module_Control::init();

		/*
		 * The WPCOM REST API v2 endpoints only register routes/fields on REST
		 * init, so defer constructing them (and autoloading their classes) until
		 * a REST request is actually served. Registered on both REST init hooks
		 * so the routes remain available in every context they were before, and
		 * guarded so the endpoints are instantiated only once per request.
		 */
		$register_rest_api_v2_endpoints = static function () {
			static $registered = false;
			if ( $registered ) {
				return;
			}
			$registered = true;
			new WPCOM_REST_API_V2_Endpoint_VideoPress();
			new WPCOM_REST_API_V2_Endpoint_VideoPress_Caption_Tracks();
			new WPCOM_REST_API_V2_Attachment_VideoPress_Field();
			new WPCOM_REST_API_V2_Attachment_VideoPress_Data();
		};
		add_action( 'rest_api_init', $register_rest_api_v2_endpoints, 0 );
		add_action( 'restapi_theme_init', $register_rest_api_v2_endpoints, 0 );

		if ( is_admin() ) {
			AJAX::init();
		} else {
			require_once __DIR__ . '/class-block-replacement.php';
			Block_Replacement::init();
		}
	}

	/**
	 * This avoids conflicts when running VideoPress plugin with older versions of the Jetpack plugin
	 *
	 * On version 11.3-a.7 utility functions include were removed from the plugin and it is safe to include it from the package
	 *
	 * @return boolean
	 */
	private static function should_include_utilities() {
		if ( ! class_exists( 'Jetpack' ) || ! defined( 'JETPACK__VERSION' ) ) {
			return true;
		}

		return version_compare( JETPACK__VERSION, '11.3-a.7', '>=' );
	}

	/**
	 * Prepare a poster URL for a quoted CSS url() inside an HTML attribute.
	 *
	 * @param mixed $poster Poster URL.
	 * @return string Sanitized and HTML-encoded poster URL, or an empty string.
	 */
	private static function prepare_poster_url_for_inline_style( $poster ) {
		if ( ! is_string( $poster ) || '' === $poster ) {
			return '';
		}

		/*
		 * Decode one layer so ordinarily encoded URLs retain their semantics. Any
		 * remaining entities are encoded again below and stay inert after the HTML
		 * parser performs its single decoding pass.
		 */
		$poster_url = esc_url_raw( html_entity_decode( $poster, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( '' === $poster_url ) {
			return '';
		}

		/*
		 * Force existing character references to be encoded. esc_attr() preserves
		 * them, but this value crosses from an HTML attribute into a CSS string.
		 */
		return htmlspecialchars( $poster_url, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8', true );
	}

	/**
	 * Initialize VideoPress features that should be initialized only when the module is active
	 *
	 * @return void
	 */
	private static function active_initialization() {
		Attachment_Handler::init();
		Jwt_Token_Bridge::init();
		Caption_Tracks::init();
		Initial_State::init();
		XMLRPC::init();
		Block_Editor_Content::init();

		/*
		 * These endpoints only add their routes on REST init, so defer calling
		 * init() (and autoloading the endpoint classes) until a REST request is
		 * served. Priority 0 ensures the routes still register before the
		 * default-priority rest_api_init handlers run. Class-name strings are
		 * used so the classes are not autoloaded on non-REST requests.
		 */
		foreach (
			array(
				Uploader_Rest_Endpoints::class,
				Rest_Controller::class,
				VideoPress_Rest_Api_V1_Stats::class,
				VideoPress_Rest_Api_V1_Site::class,
				VideoPress_Rest_Api_V1_Settings::class,
				VideoPress_Rest_Api_V1_Features::class,
			) as $rest_endpoint
		) {
			add_action( 'rest_api_init', array( $rest_endpoint, 'init' ), 0 );
		}
		self::register_oembed_providers();

		// Enqueuethe VideoPress Iframe API script in the front-end.
		add_filter( 'embed_oembed_html', array( __CLASS__, 'enqueue_videopress_iframe_api_script' ), 10, 4 );

		if ( self::should_initialize_admin_ui() ) {
			Admin_UI::init();
		}

		Divi::init();
	}

	/**
	 * Explicitly register VideoPress oembed provider for patterns not supported by core
	 *
	 * @return void
	 */
	public static function register_oembed_providers() {
		$host = rawurlencode( home_url() );
		// videopress.com/v is already registered in core.
		// By explicitly declaring the provider here, we can speed things up by not relying on oEmbed discovery.
		wp_oembed_add_provider( '#^https?://video.wordpress.com/v/.*#', 'https://public-api.wordpress.com/oembed/?for=' . $host, true );
		// This is needed as it's not supported in oEmbed discovery.
		wp_oembed_add_provider( '|^https?://v\.wordpress\.com/([a-zA-Z\d]{8})(.+)?$|i', 'https://public-api.wordpress.com/oembed/?for=' . $host, true ); // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText

		add_filter( 'embed_oembed_html', array( __CLASS__, 'video_enqueue_bridge_when_oembed_present' ), 10, 4 );
	}

	/**
	 * Enqueues VideoPress token bridge when a VideoPress oembed is present on the current page.
	 *
	 * @param string|false $cache   The cached HTML result, stored in post meta.
	 * @param string       $url     The attempted embed URL.
	 * @param array        $attr    An array of shortcode attributes.
	 * @param int          $post_ID Post ID.
	 *
	 * @return string|false
	 */
	public static function video_enqueue_bridge_when_oembed_present( $cache, $url, $attr, $post_ID = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( Utils::is_videopress_url( $url ) ) {
			Jwt_Token_Bridge::enqueue_jwt_token_bridge();
		}

		return $cache;
	}

	/**
	 * Register all VideoPress blocks
	 *
	 * @return void
	 */
	public static function register_videopress_blocks() {
		// Register VideoPress Video block.
		self::register_videopress_video_block();

		// Register Video Playlist block.
		self::register_videopress_playlist_block();
	}

	/**
	 * VideoPress video block render method
	 *
	 * @global \WP_Embed $wp_embed WordPress embed handler.
	 *
	 * @param array     $block_attributes Block attributes.
	 * @param string    $content          Current block markup.
	 * @param \WP_Block $block            Current block.
	 *
	 * @return string Block markup.
	 */
	public static function render_videopress_video_block( $block_attributes, $content, $block ) {
		global $wp_embed;

		// Pre-build and cache the GUID list for this post to optimize authorization checks.
		// This is called once per page render and caches GUIDs from all VideoPress blocks
		// (including those in synced patterns), allowing fast O(1) lookups during token requests.
		$post_id = $block->context['postId'] ?? get_the_ID();
		if ( ! empty( $post_id ) ) {
			Access_Control::build_and_cache_post_guids( absint( $post_id ) );
		}

		// CSS classes.
		$align        = $block_attributes['align'] ?? null;
		$align_class  = $align ? ' align' . $align : '';
		$custom_class = isset( $block_attributes['className'] ) ? ' ' . $block_attributes['className'] : '';
		$classes      = 'wp-block-jetpack-videopress jetpack-videopress-player' . $custom_class . $align_class;

		// Inline style.
		$style     = '';
		$max_width = isset( $block_attributes['maxWidth'] ) && is_string( $block_attributes['maxWidth'] )
			? trim( $block_attributes['maxWidth'] )
			: '';

		// maxWidth is rendered into an inline style. Accept only a plain CSS length
		// or percentage so the value stays a single, well-formed declaration;
		// anything else is dropped and the block renders at full width (as with the
		// "100%" default).
		if ( '' !== $max_width && '100%' !== $max_width
			&& preg_match( '/^\d+(\.\d+)?(px|%|em|rem|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc|q)$/i', $max_width )
		) {
			$style    = sprintf( 'max-width: %s;', $max_width );
			$classes .= ' wp-block-jetpack-videopress--has-max-width';
		}

		/*
		 * <figcaption /> element
		 * Caption is stored into the block attributes,
		 * but also it was stored into the <figcaption /> element,
		 * meaning that it could be stored in two different places.
		 */
		$figcaption = '';

		// Caption from block attributes.
		$caption = $block_attributes['caption'] ?? null;

		/*
		 * If the caption is not stored into the block attributes,
		 * try to get it from the <figcaption /> element.
		 */
		if ( null === $caption ) {
			preg_match( '/<figcaption>(.*?)<\/figcaption>/', $content, $matches );
			$caption = $matches[1] ?? null;
		}

		// If we have a caption, create the <figcaption /> element.
		if ( null !== $caption ) {
			$figcaption = sprintf( '<figcaption>%s</figcaption>', wp_kses_post( $caption ) );
		}

		// Custom anchor from block content.
		$id_attribute = '';

		// Try to get the custom anchor from the block attributes.
		if ( isset( $block_attributes['anchor'] ) && $block_attributes['anchor'] ) {
			$id_attribute = sprintf( 'id="%s"', esc_attr( $block_attributes['anchor'] ) );
		} elseif ( preg_match( '/<figure[^>]*id="([^"]+)"/', $content, $matches ) ) {
			// Otherwise, try to get the custom anchor from the <figure /> element.
			$id_attribute = sprintf( 'id="%s"', esc_attr( $matches[1] ) );
		}

		// Preview On Hover data.
		$is_poh_enabled =
			isset( $block_attributes['posterData']['previewOnHover'] ) &&
			$block_attributes['posterData']['previewOnHover'];

		$autoplay = $block_attributes['autoplay'] ?? false;
		$controls = $block_attributes['controls'] ?? false;
		$poster   = $block_attributes['posterData']['url'] ?? null;

		$preview_on_hover = '';

		if ( $is_poh_enabled ) {
			$preview_on_hover = array(
				'previewAtTime'       => $block_attributes['posterData']['previewAtTime'],
				'previewLoopDuration' => $block_attributes['posterData']['previewLoopDuration'],
				'autoplay'            => $autoplay,
				'showControls'        => $controls,
			);

			// Create inline style in case video has a custom poster.
			$inline_style = '';
			$poster_url   = self::prepare_poster_url_for_inline_style( $poster );
			if ( $poster_url ) {
				// Emit the poster URL as a double-quoted CSS string so it stays
				// contained within url() and cannot affect the surrounding style.
				$inline_style = sprintf(
					'style="background-image: url(&quot;%s&quot;); background-size: cover; background-position: center center;"',
					$poster_url
				);
			}

			// Expose the preview on hover data to the client.
			$preview_on_hover = sprintf(
				'<div class="jetpack-videopress-player__overlay" %s></div><script type="application/json">%s</script>',
				$inline_style,
				wp_json_encode( $preview_on_hover, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP )
			);

			// Set `autoplay` and `muted` attributes to the video element.
			$block_attributes['autoplay'] = true;
			$block_attributes['muted']    = true;
		}

		$figure_template = '
		<figure class="%1$s" style="%2$s" %3$s>
			%4$s
			%5$s
			%6$s
		</figure>
		';

		// VideoPress URL.
		$guid           = $block_attributes['guid'] ?? null;
		$videopress_url = Utils::get_video_press_url( $guid, $block_attributes );

		$video_wrapper         = '';
		$video_wrapper_classes = 'jetpack-videopress-player__wrapper';

		if ( $videopress_url ) {
			$videopress_url = wp_kses_post( $videopress_url );

			/*
			 * Provide a fallback iframe for when the oEmbed endpoint fails, e.g.
			 * when the VideoPress backend isn't ready for a freshly uploaded video.
			 * This prevents the published page from showing a bare link.
			 */
			$fallback = function ( $output, $url ) use ( $videopress_url ) {
				$decoded_url = html_entity_decode( $videopress_url, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
				if ( $decoded_url !== $url ) {
					return $output;
				}

				return sprintf(
					'<iframe title="%1$s" aria-label="%1$s" src="%2$s" width="640" height="360" allowfullscreen data-resize-to-parent="true" allow="clipboard-write; presentation"></iframe>',
					esc_attr__( 'VideoPress Video Player', 'jetpack-videopress-pkg' ),
					esc_url( preg_replace( '#/v/#', '/embed/', $url, 1 ) )
				);
			};

			add_filter( 'embed_maybe_make_link', $fallback, 10, 2 );
			$oembed_html = apply_filters( 'video_embed_html', $wp_embed->shortcode( array(), $videopress_url ) );
			remove_filter( 'embed_maybe_make_link', $fallback );

			$video_wrapper = sprintf(
				'<div class="%s">%s %s</div>',
				$video_wrapper_classes,
				$preview_on_hover,
				$oembed_html
			);

			/*
			 * Self-heal failed oEmbed cache for VideoPress URLs.
			 *
			 * When the VideoPress backend isn't ready for a freshly uploaded video,
			 * WordPress caches '{{unknown}}' in post meta with a TTL that is too long
			 * for this use case. Clear recent failures so the next page render retries
			 * oEmbed discovery, keeping the fallback iframe above temporary.
			 */
			$post_id = $block->context['postId'] ?? get_the_ID();

			if ( $post_id ) {
				$key_suffix   = md5( $videopress_url . serialize( wp_embed_defaults( $videopress_url ) ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- Matching WP_Embed cache key format.
				$oembed_value = get_post_meta( $post_id, '_oembed_' . $key_suffix, true );
				$oembed_time  = (int) get_post_meta( $post_id, '_oembed_time_' . $key_suffix, true );

				/*
				 * Only clear the '{{unknown}}' cache entry when it is recent, to avoid
				 * disabling WordPress's oEmbed backoff for persistent provider failures.
				 */
				if (
					'{{unknown}}' === $oembed_value
					&& ( ! $oembed_time || ( time() - $oembed_time ) < MINUTE_IN_SECONDS )
				) {
					delete_post_meta( $post_id, '_oembed_' . $key_suffix );
					delete_post_meta( $post_id, '_oembed_time_' . $key_suffix );
				}
			}
		}

		// Get premium content from block context.
		$premium_block_plan_id    = isset( $block->context['premium-content/planId'] ) ? intval( $block->context['premium-content/planId'] ) : 0;
		$is_premium_content_child = isset( $block->context['isPremiumContentChild'] ) ? (bool) $block->context['isPremiumContentChild'] : false;
		$maybe_premium_script     = '';
		if ( $is_premium_content_child ) {
			Access_Control::instance()->set_guid_subscription( $guid, $premium_block_plan_id );
			$escaped_guid         = wp_json_encode( $guid, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
			$script_content       = "if ( ! window.__guidsToPlanIds ) { window.__guidsToPlanIds = {}; }; window.__guidsToPlanIds[$escaped_guid] = $premium_block_plan_id;";
			$maybe_premium_script = '<script>' . $script_content . '</script>';
		}

		// $id_attribute, $video_wrapper, $figcaption properly escaped earlier in the code.
		return sprintf(
			$figure_template,
			esc_attr( $classes ),
			esc_attr( $style ),
			$id_attribute,
			$video_wrapper,
			$figcaption,
			$maybe_premium_script
		);
	}

	/**
	 * Register the VideoPress block editor block,
	 * AKA "VideoPress Block v6".
	 *
	 * @return void
	 */
	public static function register_videopress_video_block() {
		/*
		 * If only Jetpack is active, and if the VideoPress module is not active,
		 * we can register the block just to display a placeholder to turn on the module.
		 * That invitation is only useful for admins though.
		 */
		if (
			Status::is_jetpack_plugin_without_videopress_module_active()
			&& ! Status::is_standalone_plugin_active()
			&& ! current_user_can( 'jetpack_activate_modules' )
		) {
			return;
		}

		$videopress_video_metadata_file        = __DIR__ . '/../build/block-editor/blocks/video/block.json';
		$videopress_video_metadata_file_exists = file_exists( $videopress_video_metadata_file );
		if ( ! $videopress_video_metadata_file_exists ) {
			return;
		}

		$videopress_video_metadata = json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $videopress_video_metadata_file )
		);

		// Pick the block name straight from the block metadata .json file.
		$videopress_video_block_name = $videopress_video_metadata->name;

		// Is the block already registered?
		$is_block_registered = \WP_Block_Type_Registry::get_instance()->is_registered( $videopress_video_block_name );

		// Do not register if the block is already registered.
		if ( $is_block_registered ) {
			return;
		}

		$registration = register_block_type(
			$videopress_video_metadata_file,
			array(
				'render_callback'       => array( __CLASS__, 'render_videopress_video_block' ),
				'render_email_callback' => array( Video_Block_Email_Renderer::class, 'render' ),
				'uses_context'          => array( 'premium-content/planId', 'isPremiumContentChild', 'selectedPlanId' ),
			)
		);

		// Do not enqueue scripts if the block could not be registered.
		if ( empty( $registration ) || empty( $registration->editor_script_handles ) ) {
			return;
		}

		// Extensions use Connection_Initial_State::render_script with script handle as parameter.
		if ( is_array( $registration->editor_script_handles ) ) {
			$script_handle = $registration->editor_script_handles[0];
		} else {
			$script_handle = $registration->editor_script_handles;
		}

		// Register and enqueue scripts used by the VideoPress video block.
		Block_Editor_Extensions::init( $script_handle );
	}

	/**
	 * Register the Video Playlist block.
	 *
	 * @param string|null $metadata_file Path to the block.json metadata file. Defaults to the
	 *                                   package build output; tests can point it at a fixture.
	 *
	 * @return void
	 */
	public static function register_videopress_playlist_block( $metadata_file = null ) {
		/*
		 * Unlike the video block, the playlist block has no "activate the module"
		 * placeholder, so it is only registered where VideoPress can play videos.
		 */
		if (
			Status::is_jetpack_plugin_without_videopress_module_active()
			&& ! Status::is_standalone_plugin_active()
		) {
			return;
		}

		if ( null === $metadata_file ) {
			$metadata_file = __DIR__ . '/../build/block-editor/blocks/playlist/block.json';
		}

		if ( ! file_exists( $metadata_file ) ) {
			return;
		}

		$metadata = json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $metadata_file )
		);

		if ( empty( $metadata->name )
			|| \WP_Block_Type_Registry::get_instance()->is_registered( $metadata->name )
		) {
			return;
		}

		register_block_type(
			$metadata_file,
			array(
				'render_callback' => array( __CLASS__, 'render_videopress_playlist_block' ),
			)
		);
	}

	/**
	 * Sanitize the playlist block's videos attribute into rendering-ready entries.
	 *
	 * @param mixed $videos Raw attribute value.
	 *
	 * @return array Entries with guid, title, durationMs, height and poster keys.
	 */
	private static function sanitize_playlist_entries( $videos ) {
		if ( ! is_array( $videos ) ) {
			return array();
		}

		$entries = array();
		foreach ( $videos as $video ) {
			if ( ! is_array( $video ) || empty( $video['guid'] ) || ! is_string( $video['guid'] ) ) {
				continue;
			}

			// VideoPress GUIDs are 8 alphanumeric characters; drop anything else.
			if ( ! preg_match( '/^[a-zA-Z0-9]{8}$/', $video['guid'] ) ) {
				continue;
			}

			/*
			 * Only the video reference and numeric metadata are stored. Display
			 * metadata (title, poster) is always live: the view script reads it
			 * from the video data after the page loads.
			 */
			$entries[] = array(
				'guid'       => $video['guid'],
				'durationMs' => isset( $video['durationMs'] ) && is_numeric( $video['durationMs'] ) ? max( 0, (int) $video['durationMs'] ) : 0,
				'height'     => isset( $video['height'] ) && is_numeric( $video['height'] ) ? max( 0, (int) $video['height'] ) : 0,
			);
		}

		return $entries;
	}

	/**
	 * Build the VideoPress embed URL for a playlist entry.
	 *
	 * @param string $guid     Video GUID.
	 * @param bool   $autoplay Whether the video should start playing once loaded.
	 * @param bool   $muted    Whether playback should start muted.
	 *
	 * @return string Embed URL.
	 */
	private static function playlist_embed_url( $guid, $autoplay, $muted = false ) {
		$args = array(
			'cover'          => 1,
			'preloadContent' => 'metadata',
			'autoPlay'       => $autoplay ? 1 : 0,
		);
		if ( $muted ) {
			$args['muted'] = 1;
		}

		return add_query_arg(
			$args,
			'https://videopress.com/embed/' . rawurlencode( $guid )
		);
	}

	/**
	 * Format a duration in milliseconds as a timecode, m:ss or h:mm:ss.
	 *
	 * @param int $duration_ms Duration in milliseconds.
	 *
	 * @return string Timecode, or an empty string when the duration is unknown.
	 */
	private static function playlist_timecode( $duration_ms ) {
		if ( $duration_ms <= 0 ) {
			return '';
		}

		$total_seconds = (int) round( $duration_ms / 1000 );
		$hours         = intdiv( $total_seconds, 3600 );
		$minutes       = intdiv( $total_seconds % 3600, 60 );
		$seconds       = $total_seconds % 60;

		if ( $hours > 0 ) {
			return sprintf( '%d:%02d:%02d', $hours, $minutes, $seconds );
		}

		return sprintf( '%d:%02d', $minutes, $seconds );
	}

	/**
	 * Format a duration in milliseconds as a long runtime, e.g. "1 hr 13 min".
	 *
	 * @param int $duration_ms Duration in milliseconds.
	 *
	 * @return string Runtime label, or an empty string when the duration is unknown.
	 */
	private static function playlist_runtime_label( $duration_ms ) {
		if ( $duration_ms <= 0 ) {
			return '';
		}

		$total_minutes = max( 1, (int) round( $duration_ms / 60000 ) );
		$hours         = intdiv( $total_minutes, 60 );
		$minutes       = $total_minutes % 60;

		if ( $hours > 0 && $minutes > 0 ) {
			/* translators: 1: number of hours. 2: number of minutes. */
			return sprintf( __( '%1$d hr %2$d min', 'jetpack-videopress-pkg' ), $hours, $minutes );
		}

		if ( $hours > 0 ) {
			/* translators: %d: number of hours. */
			return sprintf( __( '%d hr', 'jetpack-videopress-pkg' ), $hours );
		}

		/* translators: %d: number of minutes. */
		return sprintf( __( '%d min', 'jetpack-videopress-pkg' ), $minutes );
	}

	/**
	 * Map a video's pixel height to a resolution label, e.g. "1080p" or "4K".
	 *
	 * @param int $height Video height in pixels.
	 *
	 * @return string Resolution label, or an empty string when the height is unknown.
	 */
	private static function playlist_resolution_label( $height ) {
		if ( $height <= 0 ) {
			return '';
		}

		return $height >= 2160 ? '4K' : $height . 'p';
	}

	/**
	 * Video Playlist block render callback.
	 *
	 * @param array $block_attributes Block attributes.
	 *
	 * @return string Block markup, or an empty string when the playlist has no playable entries.
	 */
	public static function render_videopress_playlist_block( $block_attributes ) {
		$entries = self::sanitize_playlist_entries( $block_attributes['videos'] ?? null );

		if ( ! $entries ) {
			return '';
		}

		$enabled = function ( $key, $default_value = true ) use ( $block_attributes ) {
			return isset( $block_attributes[ $key ] ) ? (bool) $block_attributes[ $key ] : $default_value;
		};

		$layout = isset( $block_attributes['layout'] ) && in_array( $block_attributes['layout'], array( 'side-rail', 'grid', 'strip' ), true )
			? $block_attributes['layout']
			: 'side-rail';

		$show_thumbnail = $enabled( 'showThumbnail' );
		$show_title     = $enabled( 'showTitle' );
		$show_res       = $enabled( 'showResolution' );
		$show_duration  = $enabled( 'showDuration' );
		$show_number    = $enabled( 'showPositionNumber', false );
		$show_runtime   = $enabled( 'showTotalRuntime' );
		$muted          = $enabled( 'muteByDefault', false );

		$classes = array( 'videopress-playlist', 'is-layout-' . $layout );
		if ( $enabled( 'darkPlayer', false ) ) {
			$classes[] = 'is-dark';
		}
		if ( ! $show_thumbnail ) {
			$classes[] = 'hide-thumbnails';
		}
		if ( ! $show_title ) {
			$classes[] = 'hide-titles';
		}
		if ( ! $show_res ) {
			$classes[] = 'hide-resolutions';
		}
		if ( ! $show_duration ) {
			$classes[] = 'hide-durations';
		}
		if ( ! $show_runtime ) {
			$classes[] = 'hide-runtime';
		}

		// Lets the embed play private videos for authorized viewers.
		Jwt_Token_Bridge::enqueue_jwt_token_bridge();

		$count    = count( $entries );
		$total_ms = 0;
		foreach ( $entries as $entry ) {
			$total_ms += $entry['durationMs'];
		}

		$total_timecode = self::playlist_timecode( $total_ms );
		/* translators: %d: number of videos in the playlist. */
		$count_label = sprintf( _n( '%d video', '%d videos', $count, 'jetpack-videopress-pkg' ), $count );

		$items = '';
		foreach ( $entries as $index => $entry ) {
			/*
			 * Positional fallback only: the view script replaces titles (and
			 * adds posters) with live video data once the page loads.
			 */
			/* translators: %d: position of the video in the playlist. */
			$title = sprintf( __( 'Video %d', 'jetpack-videopress-pkg' ), $index + 1 );

			$timecode   = self::playlist_timecode( $entry['durationMs'] );
			$resolution = self::playlist_resolution_label( $entry['height'] );
			/* translators: 1: position of the video in the playlist. 2: number of videos in the playlist. */
			$position = sprintf( __( '%1$d of %2$d', 'jetpack-videopress-pkg' ), $index + 1, $count );
			$details  = implode( ' · ', array_filter( array( $resolution, $timecode ) ) );
			$progress = '' !== $total_timecode
				/* translators: 1: position of the video in the playlist. 2: number of videos. 3: total playlist timecode. */
				? sprintf( __( '%1$d / %2$d · %3$s total', 'jetpack-videopress-pkg' ), $index + 1, $count, $total_timecode )
				/* translators: 1: position of the video in the playlist. 2: number of videos. */
				: sprintf( __( '%1$d / %2$d', 'jetpack-videopress-pkg' ), $index + 1, $count );

			$number_markup = $show_number
				? sprintf(
					'<span class="videopress-playlist__entry-number">%s</span>',
					esc_html( str_pad( (string) ( $index + 1 ), 2, '0', STR_PAD_LEFT ) )
				)
				: '';

			$time_markup = '' !== $timecode
				? sprintf( '<span class="videopress-playlist__entry-time">%s</span>', esc_html( $timecode ) )
				: '';

			$resolution_markup = '' !== $resolution
				? sprintf( '<span class="videopress-playlist__entry-resolution">%s</span>', esc_html( $resolution ) )
				: '';

			$duration_markup = '' !== $timecode
				? sprintf( '<span class="videopress-playlist__entry-duration">%s</span>', esc_html( $timecode ) )
				: '';

			$items .= sprintf(
				'<li class="videopress-playlist__entry"><button type="button" class="videopress-playlist__select%1$s"%2$s data-guid="%3$s" data-embed-url="%4$s" data-title="%5$s" data-position="%6$s" data-details="%7$s" data-progress="%8$s">' .
					'%9$s<span class="videopress-playlist__entry-thumb"><span class="videopress-playlist__entry-flag">%10$s</span>%11$s</span>' .
					'<span class="videopress-playlist__entry-body"><span class="videopress-playlist__entry-title">%12$s</span><span class="videopress-playlist__entry-meta">%13$s%14$s</span></span>' .
					'</button></li>',
				0 === $index ? ' is-current' : '',
				0 === $index ? ' aria-current="true"' : '',
				esc_attr( $entry['guid'] ),
				esc_url( self::playlist_embed_url( $entry['guid'], true, $muted ) ),
				esc_attr( $title ),
				esc_attr( $position ),
				esc_attr( $details ),
				esc_attr( $progress ),
				$number_markup,
				esc_html__( 'Playing', 'jetpack-videopress-pkg' ),
				$time_markup,
				esc_html( $title ),
				$resolution_markup,
				$duration_markup
			);
		}

		$first          = $entries[0];
		$first_title    = __( 'Video 1', 'jetpack-videopress-pkg' );
		$runtime_label  = self::playlist_runtime_label( $total_ms );
		$runtime_markup = $show_runtime && '' !== $runtime_label
			? sprintf( '<span class="videopress-playlist__runtime">%s</span>', esc_html( $runtime_label ) )
			: '';

		// Count · runtime meta line, shown by the side-rail layout in the list header.
		$list_meta_markup = sprintf(
			'<span class="videopress-playlist__list-meta"><span class="videopress-playlist__count">%s</span>%s</span>',
			esc_html( $count_label ),
			$runtime_markup
		);

		/*
		 * The player renders its own title overlay, so the stage carries no
		 * duplicate now-playing text — only the grid layout's runtime line.
		 */
		$now_markup = $show_runtime && '' !== $runtime_label
			? sprintf(
				'<div class="videopress-playlist__now"><span class="videopress-playlist__now-runtime">%s</span></div>',
				esc_html( $count_label . ' · ' . $runtime_label )
			)
			: '';

		$stage_markup = sprintf(
			'<div class="videopress-playlist__stage">' .
				'<div class="videopress-playlist__player"><iframe class="videopress-playlist__iframe" title="%1$s" src="%2$s" allowfullscreen allow="clipboard-write"></iframe></div>%3$s</div>',
			esc_attr( $first_title ),
			esc_url( self::playlist_embed_url( $first['guid'], false, $muted ) ),
			$now_markup
		);

		$progress_markup = '' !== $total_timecode
			? sprintf(
				'<span class="videopress-playlist__list-progress">%s</span>',
				/* translators: 1: position of the current video. 2: number of videos. 3: total playlist timecode. */
				esc_html( sprintf( __( '%1$d / %2$d · %3$s total', 'jetpack-videopress-pkg' ), 1, $count, $total_timecode ) )
			)
			: '';

		$list_markup = sprintf(
			'<div class="videopress-playlist__list">' .
				'<div class="videopress-playlist__list-header">' .
				'<span class="videopress-playlist__list-label videopress-playlist__list-label--rail">%1$s</span>' .
				'<span class="videopress-playlist__list-label videopress-playlist__list-label--strip">%2$s</span>%3$s%4$s</div>' .
				'<ol class="videopress-playlist__entries">%5$s</ol></div>',
			esc_html__( 'Up next', 'jetpack-videopress-pkg' ),
			/* translators: %s: number of videos in the playlist, e.g. "5 videos". */
			esc_html( sprintf( __( 'Playlist — %s', 'jetpack-videopress-pkg' ), $count_label ) ),
			$list_meta_markup,
			$progress_markup,
			$items
		);

		/*
		 * User-selected theme font presets (theme.json slugs) for the
		 * customizable titles, exposed as CSS custom properties the
		 * stylesheet reads. Anything but a plain preset slug is dropped.
		 */
		$font_style = '';
		foreach ( array(
			'entryTitleFontFamily' => '--vpp-entry-title-font',
		) as $font_attribute => $css_variable ) {
			if ( ! empty( $block_attributes[ $font_attribute ] )
				&& is_string( $block_attributes[ $font_attribute ] )
				&& preg_match( '/^[a-zA-Z0-9-]+$/', $block_attributes[ $font_attribute ] )
			) {
				$font_style .= $css_variable . ':var(--wp--preset--font-family--' . $block_attributes[ $font_attribute ] . ');';
			}
		}

		// Looping implies auto-advancing, so it forces the autoplay-next flag on.
		$loop_playlist = $enabled( 'loopPlaylist', false );

		$wrapper_extra_attributes = array(
			'class'              => implode( ' ', $classes ),
			'data-autoplay-next' => $enabled( 'autoplayNext', false ) || $loop_playlist ? '1' : '0',
			'data-loop'          => $loop_playlist ? '1' : '0',
		);
		if ( '' !== $font_style ) {
			$wrapper_extra_attributes['style'] = $font_style;
		}

		$wrapper_attributes = get_block_wrapper_attributes( $wrapper_extra_attributes );

		return sprintf(
			'<figure %1$s><div class="videopress-playlist__body">%2$s%3$s</div></figure>',
			$wrapper_attributes,
			$stage_markup,
			$list_markup
		);
	}

	/**
	 * Enqueue the VideoPress Iframe API script
	 * when the URL of oEmbed HTML is a VideoPress URL.
	 *
	 * @param string|false $cache   The cached HTML result, stored in post meta.
	 * @param string       $url     The attempted embed URL.
	 * @param array        $attr    An array of shortcode attributes.
	 * @param int          $post_ID Post ID.
	 *
	 * @return string|false
	 */
	public static function enqueue_videopress_iframe_api_script( $cache, $url, $attr, $post_ID ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( Utils::is_videopress_url( $url ) ) {
			// Enqueue the VideoPress IFrame API in the front-end.
			wp_enqueue_script(
				self::JETPACK_VIDEOPRESS_IFRAME_API_HANDLER,
				'https://s0.wp.com/wp-content/plugins/video/assets/js/videojs/videopress-iframe-api.js',
				array(),
				gmdate( 'YW' ),
				false
			);
		}

		return $cache;
	}
}
