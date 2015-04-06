<?php

// Include the class file containing methods for rounding constrained array elements.
// Here the constrained array element is the dimension of a row, group or an image in the tiled gallery.
include_once dirname( __FILE__ ) . '/math/class-constrained-array-rounding.php';

// Layouts
include_once dirname( __FILE__ ) . '/tiled-gallery/tiled-gallery-rectangular.php';
include_once dirname( __FILE__ ) . '/tiled-gallery/tiled-gallery-square.php';
include_once dirname( __FILE__ ) . '/tiled-gallery/tiled-gallery-circle.php';

class Jetpack_Tiled_Gallery {
	private static $talaveras = array( 'rectangular', 'square', 'circle', 'rectangle', 'columns' );

	public function __construct() {
		add_action( 'admin_init', array( $this, 'settings_api_init' ) );
		add_filter( 'jetpack_gallery_types', array( $this, 'jetpack_gallery_types' ), 9 );
		add_filter( 'jetpack_default_gallery_type', array( $this, 'jetpack_default_gallery_type' ) );
	}

	public function tiles_enabled() {
		// Check the setting status
		return '' != get_option( 'tiled_galleries' );
	}

	public function set_atts( $atts ) {
		global $post;

		$this->atts = shortcode_atts( array(
			'order'      => 'ASC',
			'orderby'    => 'menu_order ID',
			'id'         => isset( $post->ID ) ? $post->ID : 0,
			'include'    => '',
			'exclude'    => '',
			'type'       => '',
			'grayscale'  => false,
			'link'       => '',
			'columns'	 => 3
		), $atts, 'gallery' );

		$this->atts['id'] = (int) $this->atts['id'];
		$this->float = is_rtl() ? 'right' : 'left';

		// Default to rectangular is tiled galleries are checked
		if ( $this->tiles_enabled() && ( ! $this->atts['type'] || 'default' == $this->atts['type'] ) )
			$this->atts['type'] = 'rectangular';

		if ( !$this->atts['orderby'] ) {
			$this->atts['orderby'] = sanitize_sql_orderby( $this->atts['orderby'] );
			if ( !$this->atts['orderby'] )
				$this->atts['orderby'] = 'menu_order ID';
		}

		if ( 'rand' == strtolower( $this->atts['order'] ) ) {
			$this->atts['orderby'] = 'rand';
		}

		// We shouldn't have more than 20 columns.
		if ( ! is_numeric( $this->atts['columns'] ) || 20 < $this->atts['columns'] ) {
			$this->atts['columns'] = 3;
		}
	}

	public function get_attachments() {
		extract( $this->atts );

		if ( !empty( $include ) ) {
			$include = preg_replace( '/[^0-9,]+/', '', $include );
			$_attachments = get_posts( array('include' => $include, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby) );

			$attachments = array();
			foreach ( $_attachments as $key => $val ) {
				$attachments[$val->ID] = $_attachments[$key];
			}
		} elseif ( 0 == $id ) {
			// Should NEVER Happen but infinite_scroll_load_other_plugins_scripts means it does
			// Querying with post_parent == 0 can generate stupidly memcache sets on sites with 10000's of unattached attachments as get_children puts every post in the cache.
			// TODO Fix this properly
			$attachments = array();
		} elseif ( !empty( $exclude ) ) {
			$exclude = preg_replace( '/[^0-9,]+/', '', $exclude );
			$attachments = get_children( array('post_parent' => $id, 'exclude' => $exclude, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby) );
		} else {
			$attachments = get_children( array('post_parent' => $id, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby ) );
		}
		return $attachments;
	}

	public static function default_scripts_and_styles() {
		wp_enqueue_script( 'tiled-gallery', plugins_url( 'tiled-gallery/tiled-gallery.js', __FILE__ ), array( 'jquery' ) );
		if( is_rtl() ) {
			wp_enqueue_style( 'tiled-gallery', plugins_url( 'tiled-gallery/rtl/tiled-gallery-rtl.css', __FILE__ ), array(), '2012-09-21' );
		} else {
			wp_enqueue_style( 'tiled-gallery', plugins_url( 'tiled-gallery/tiled-gallery.css', __FILE__ ), array(), '2012-09-21' );
		}
	}

	public function gallery_shortcode( $val, $atts ) {
		if ( ! empty( $val ) ) // something else is overriding post_gallery, like a custom VIP shortcode
			return $val;

		global $post;

		$this->set_atts( $atts );

		$attachments = $this->get_attachments();
		if ( empty( $attachments ) )
			return '';

		if ( is_feed() || defined( 'IS_HTML_EMAIL' ) )
			return '';

		if ( in_array( $this->atts['type'], self::$talaveras ) ) {
			// Enqueue styles and scripts
			self::default_scripts_and_styles();

			// Generate gallery HTML
			$gallery_class = 'Jetpack_Tiled_Gallery_Layout_' . ucfirst( $this->atts['type'] );
			$gallery = new $gallery_class( $attachments, $this->atts['link'], $this->atts['grayscale'], (int) $this->atts['columns'] );
			$gallery_html = $gallery->HTML();

			if ( $gallery_html && class_exists( 'Jetpack' ) && class_exists( 'Jetpack_Photon' ) ) {
				// Tiled Galleries in Jetpack require that Photon be active.
				// If it's not active, run it just on the gallery output.
				if ( ! in_array( 'photon', Jetpack::get_active_modules() ) && ! Jetpack::is_development_mode() )
					$gallery_html = Jetpack_Photon::filter_the_content( $gallery_html );
			}

			return trim( preg_replace( '/\s+/', ' ', $gallery_html ) ); // remove any new lines from the output so that the reader parses it better
		}

		return '';
	}

	public static function gallery_already_redefined() {
		global $shortcode_tags;
		$redefined = false;
		if ( ! isset( $shortcode_tags[ 'gallery' ] ) || $shortcode_tags[ 'gallery' ] !== 'gallery_shortcode' ) {
			$redefined = true;
		}
		return apply_filters( 'jetpack_tiled_gallery_shortcode_redefined', $redefined );
	}

	public static function init() {
		if ( self::gallery_already_redefined() )
			return;

		$gallery = new Jetpack_Tiled_Gallery;
		add_filter( 'post_gallery', array( $gallery, 'gallery_shortcode' ), 1001, 2 );
	}

	public static function get_content_width() {
		$tiled_gallery_content_width = Jetpack::get_content_width();

		if ( ! $tiled_gallery_content_width )
			$tiled_gallery_content_width = 500;

		return apply_filters( 'tiled_gallery_content_width', $tiled_gallery_content_width );
	}

	/**
	 * Media UI integration
	 */
	function jetpack_gallery_types( $types ) {
		if ( get_option( 'tiled_galleries' ) && isset( $types['default'] ) ) {
			// Tiled is set as the default, meaning that type='default'
			// will still display the mosaic.
			$types['thumbnails'] = $types['default'];
			unset( $types['default'] );
		}

		$types['rectangular'] = __( 'Tiled Mosaic', 'jetpack' );
		$types['square'] = __( 'Square Tiles', 'jetpack' );
		$types['circle'] = __( 'Circles', 'jetpack' );
		$types['columns'] = __( 'Tiled Columns', 'jetpack' );

		return $types;
	}

	function jetpack_default_gallery_type( $default ) {
		return ( get_option( 'tiled_galleries' ) ? 'rectangular' : 'default' );
	}

	static function get_talaveras() {
		return self::$talaveras;
	}

	/**
	 * Add a checkbox field to the Carousel section in Settings > Media
	 * for setting tiled galleries as the default.
	 */
	function settings_api_init() {
		global $wp_settings_sections;

		// Add the setting field [tiled_galleries] and place it in Settings > Media
		if ( isset( $wp_settings_sections['media']['carousel_section'] ) )
			$section = 'carousel_section';
		else
			$section = 'default';

		add_settings_field( 'tiled_galleries', __( 'Tiled Galleries', 'jetpack' ), array( $this, 'setting_html' ), 'media', $section );
		register_setting( 'media', 'tiled_galleries', 'esc_attr' );
	}

	function setting_html() {
		echo '<label><input name="tiled_galleries" type="checkbox" value="1" ' .
			checked( 1, '' != get_option( 'tiled_galleries' ), false ) . ' /> ' .
			__( 'Display all your gallery pictures in a cool mosaic.', 'jetpack' ) . '</br></label>';
	}
}

add_action( 'init', array( 'Jetpack_Tiled_Gallery', 'init' ) );

