<?php

/**
 * Slideshow shortcode usage: [gallery type="slideshow"] or the older [slideshow]
 */
class Jetpack_Slideshow_Shortcode {
	public $instance_count = 0;

	function __construct() {
		global $shortcode_tags;

		// Only if the slideshow shortcode has not already been defined.
		if ( ! array_key_exists( 'slideshow', $shortcode_tags ) ) {
			add_shortcode( 'slideshow', array( $this, 'shortcode_callback' ) );
		}

		// Only if the gallery shortcode has not been redefined.
		if ( isset( $shortcode_tags['gallery'] ) && 'gallery_shortcode' === $shortcode_tags['gallery'] ) {
			add_filter( 'post_gallery', array( $this, 'post_gallery' ), 1002, 2 );
			add_filter( 'jetpack_gallery_types', array( $this, 'add_gallery_type' ), 10 );
		}

		/**
		 * For the moment, comment out the setting for v2.8.
		 * The remainder should work as it always has.
		 * See: https://github.com/Automattic/jetpack/pull/85/files
		 */
		// add_action( 'admin_init', array( $this, 'register_settings' ), 5 );
	}

	/**
	 * Responds to the [gallery] shortcode, but not an actual shortcode callback.
	 *
	 * @param $value string An empty string if nothing has modified the gallery output, the output html otherwise
	 * @param $attr  array The shortcode attributes array
	 *
	 * @return string The (un)modified $value
	 */
	function post_gallery( $value, $attr ) {
		// Bail if somebody else has done something
		if ( ! empty( $value ) ) {
			return $value;
		}

		// If [gallery type="slideshow"] have it behave just like [slideshow]
		if ( ! empty( $attr['type'] ) && 'slideshow' == $attr['type'] ) {
			return $this->shortcode_callback( $attr );
		}

		return $value;
	}

	/**
	 * Add the Slideshow type to gallery settings
	 *
	 * @see Jetpack_Tiled_Gallery::media_ui_print_templates
	 *
	 * @param $types array An array of types where the key is the value, and the value is the caption.
	 *
	 * @return array
	 */
	function add_gallery_type( $types = array() ) {
		$types['slideshow'] = esc_html__( 'Slideshow', 'jetpack' );

		return $types;
	}

	function register_settings() {
		add_settings_section( 'slideshow_section', __( 'Image Gallery Slideshow', 'jetpack' ), '__return_empty_string', 'media' );

		add_settings_field( 'jetpack_slideshow_background_color', __( 'Background color', 'jetpack' ), array( $this, 'slideshow_background_color_callback' ), 'media', 'slideshow_section' );

		register_setting( 'media', 'jetpack_slideshow_background_color', array( $this, 'slideshow_background_color_sanitize' ) );
	}

	function slideshow_background_color_callback() {
		$options = array(
			'black' => __( 'Black', 'jetpack' ),
			'white' => __( 'White', 'jetpack' ),
		);
		$this->settings_select( 'jetpack_slideshow_background_color', $options );
	}

	function settings_select( $name, $values, $extra_text = '' ) {
		if ( empty( $name ) || empty( $values ) || ! is_array( $values ) ) {
			return;
		}
		$option = get_option( $name );
		?>
		<fieldset>
			<select name="<?php echo esc_attr( $name ); ?>" id="<?php echo esc_attr( $name ); ?>">
				<?php foreach ( $values as $key => $value ) : ?>
					<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $key, $option ); ?>>
						<?php echo esc_html( $value ); ?>
					</option>
				<?php endforeach; ?>
			</select>
			<?php if ( ! empty( $extra_text ) ) : ?>
				<p class="description"><?php echo esc_html( $extra_text ); ?></p>
			<?php endif; ?>
		</fieldset>
		<?php
	}

	function slideshow_background_color_sanitize( $value ) {
		return ( 'white' == $value ) ? 'white' : 'black';
	}

	function shortcode_callback( $attr ) {
		$post_id = get_the_ID();

		$attr = shortcode_atts(
			array(
				'trans'     => 'fade',
				'order'     => 'ASC',
				'orderby'   => 'menu_order ID',
				'id'        => $post_id,
				'include'   => '',
				'exclude'   => '',
				'autostart' => true,
				'size'      => '',
			), $attr, 'slideshow'
		);

		if ( 'rand' == strtolower( $attr['order'] ) ) {
			$attr['orderby'] = 'none';
		}

		$attr['orderby'] = sanitize_sql_orderby( $attr['orderby'] );
		if ( ! $attr['orderby'] ) {
			$attr['orderby'] = 'menu_order ID';
		}

		if ( ! $attr['size'] ) {
			$attr['size'] = 'full';
		}

		// Don't restrict to the current post if include
		$post_parent = ( empty( $attr['include'] ) ) ? intval( $attr['id'] ) : null;

		$attachments = get_posts(
			array(
				'post_status'    => 'inherit',
				'post_type'      => 'attachment',
				'post_mime_type' => 'image',
				'posts_per_page' => - 1,
				'post_parent'    => $post_parent,
				'order'          => $attr['order'],
				'orderby'        => $attr['orderby'],
				'include'        => $attr['include'],
				'exclude'        => $attr['exclude'],
			)
		);

		if ( count( $attachments ) < 1 ) {
			return false;
		}

		$gallery_instance = sprintf( 'gallery-%d-%d', $attr['id'], ++$this->instance_count );

		$gallery = array();
		foreach ( $attachments as $attachment ) {
			$attachment_image_src   = wp_get_attachment_image_src( $attachment->ID, $attr['size'] );
			$attachment_image_src   = $attachment_image_src[0]; // [url, width, height]
			$attachment_image_title = get_the_title( $attachment->ID );
			$attachment_image_alt   = get_post_meta( $attachment->ID, '_wp_attachment_image_alt', true );
			/**
			 * Filters the Slideshow slide caption.
			 *
			 * @module shortcodes
			 *
			 * @since 2.3.0
			 *
			 * @param string wptexturize( strip_tags( $attachment->post_excerpt ) ) Post excerpt.
			 * @param string $attachment ->ID Attachment ID.
			 */
			$caption = apply_filters( 'jetpack_slideshow_slide_caption', wptexturize( strip_tags( $attachment->post_excerpt ) ), $attachment->ID );

			$gallery[] = (object) array(
				'src'     => (string) esc_url_raw( $attachment_image_src ),
				'id'      => (string) $attachment->ID,
				'title'   => (string) esc_attr( $attachment_image_title ),
				'alt'     => (string) esc_attr( $attachment_image_alt ),
				'caption' => (string) $caption,
				'itemprop' => 'image',
			);
		}

		$color = Jetpack_Options::get_option( 'slideshow_background_color', 'black' );

		$js_attr = array(
			'gallery'   => $gallery,
			'selector'  => $gallery_instance,
			'trans'     => $attr['trans'] ? $attr['trans'] : 'fade',
			'autostart' => $attr['autostart'] ? $attr['autostart'] : 'true',
			'color'     => $color,
		);

		// Show a link to the gallery in feeds.
		if ( is_feed() ) {
			return sprintf(
				'<a href="%s">%s</a>',
				esc_url( get_permalink( $post_id ) . '#' . $gallery_instance . '-slideshow' ),
				esc_html__( 'Click to view slideshow.', 'jetpack' )
			);
		}

		return $this->slideshow_js( $js_attr );
	}

	/**
	 * Render the slideshow js
	 *
	 * Returns the necessary markup and js to fire a slideshow.
	 *
	 * @param $attr array Attributes for the slideshow.
	 *
	 * @uses $this->enqueue_scripts()
	 *
	 * @return string HTML output.
	 */
	function slideshow_js( $attr ) {
		// Enqueue scripts
		$this->enqueue_scripts();

		$output = '';

		if ( defined( 'JSON_HEX_AMP' ) ) {
			// This is nice to have, but not strictly necessary since we use _wp_specialchars() below
			$gallery = json_encode( $attr['gallery'], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
		} else {
			$gallery = json_encode( $attr['gallery'] );
		}

		$output .= '<p class="jetpack-slideshow-noscript robots-nocontent">' . esc_html__( 'This slideshow requires JavaScript.', 'jetpack' ) . '</p>';
		$output .= sprintf(
			'<div id="%s" class="slideshow-window jetpack-slideshow slideshow-%s" data-trans="%s" data-autostart="%s" data-gallery="%s" itemscope itemtype="https://schema.org/ImageGallery"></div>',
			esc_attr( $attr['selector'] . '-slideshow' ),
			esc_attr( $attr['color'] ),
			esc_attr( $attr['trans'] ),
			esc_attr( $attr['autostart'] ),
			/*
			 * The input to json_encode() above can contain '&quot;'.
			 *
			 * For calls to json_encode() lacking the JSON_HEX_AMP option,
			 * that '&quot;' is left unaltered.  Running '&quot;' through esc_attr()
			 * also leaves it unaltered since esc_attr() does not double-encode.
			 *
			 * This means we end up with an attribute like
			 * `data-gallery="{&quot;foo&quot;:&quot;&quot;&quot;}"`,
			 * which is interpreted by the browser as `{"foo":"""}`,
			 * which cannot be JSON decoded.
			 *
			 * The preferred workaround is to include the JSON_HEX_AMP (and friends)
			 * options, but these are not available until 5.3.0.
			 * Alternatively, we can use _wp_specialchars( , , , true ) instead of
			 * esc_attr(), which will double-encode.
			 *
			 * Since we can't rely on JSON_HEX_AMP, we do both.
			 */
			_wp_specialchars( wp_check_invalid_utf8( $gallery ), ENT_QUOTES, false, true )
		);

		return $output;
	}

	/**
	 * Actually enqueues the scripts and styles.
	 */
	function enqueue_scripts() {

		wp_enqueue_script( 'jquery-cycle', plugins_url( '/js/jquery.cycle.min.js', __FILE__ ), array( 'jquery' ), '20161231', true );
		wp_enqueue_script( 'jetpack-slideshow', plugins_url( '/js/slideshow-shortcode.js', __FILE__ ), array( 'jquery-cycle' ), '20160119.1', true );
		if ( is_rtl() ) {
			wp_enqueue_style( 'jetpack-slideshow', plugins_url( '/css/rtl/slideshow-shortcode-rtl.css', __FILE__ ) );
		} else {
			wp_enqueue_style( 'jetpack-slideshow', plugins_url( '/css/slideshow-shortcode.css', __FILE__ ) );
		}

		wp_localize_script(
			'jetpack-slideshow',
			'jetpackSlideshowSettings',
			/**
			 * Filters the slideshow JavaScript spinner.
			 *
			 * @module shortcodes
			 *
			 * @since 2.1.0
			 * @since 4.7.0 Added the `speed` option to the array of options.
			 *
			 * @param array $args
			 * - string - spinner - URL of the spinner image.
			 * - string - speed   - Speed of the slideshow. Defaults to 4000.
			 */
			apply_filters( 'jetpack_js_slideshow_settings', array(
				'spinner' => plugins_url( '/img/slideshow-loader.gif', __FILE__ ),
				'speed'   => '4000',
			) )
		);
	}

	public static function init() {
		new Jetpack_Slideshow_Shortcode;
	}
}

Jetpack_Slideshow_Shortcode::init();
