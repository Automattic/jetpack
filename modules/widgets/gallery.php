<?php

/*
Plugin Name: Gallery
Description: Gallery widget
Author: Automattic Inc.
Version: 1.0
Author URI: http://automattic.com
*/

class Jetpack_Gallery_Widget extends WP_Widget {
	const THUMB_SIZE 		= 45;
	const DEFAULT_WIDTH 	= 265;

	protected $_instance_width ;

	public function __construct() {
		$widget_ops 	= array(
			'classname'   => 'widget-gallery',
			'description' => __( 'Display a photo gallery or slideshow', 'jetpack' ),
			'customize_selective_refresh' => true,
		);

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );

		parent::__construct(
			'gallery',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Gallery', 'jetpack' ) ),
			$widget_ops
		);

		if ( is_customize_preview() ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_scripts' ) );

			if ( class_exists( 'Jetpack_Tiled_Gallery' ) ) {
				$tiled_gallery = new Jetpack_Tiled_Gallery();
				add_action( 'wp_enqueue_scripts', array( $tiled_gallery, 'default_scripts_and_styles' ) );
			}

			if ( class_exists( 'Jetpack_Slideshow_Shortcode' ) ) {
				$slideshow = new Jetpack_Slideshow_Shortcode();
				add_action( 'wp_enqueue_scripts', array( $slideshow, 'enqueue_scripts' ) );
			}

			if ( class_exists( 'Jetpack_Carousel' ) ) {
				$carousel = new Jetpack_Carousel();
				add_action( 'wp_enqueue_scripts', array( $carousel, 'enqueue_assets' ) );
			}
		}
	}

	/**
	 * @param array $args Display arguments including before_title, after_title, before_widget, and after_widget.
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->defaults() );

		$this->enqueue_frontend_scripts();

		extract( $args );

		$instance['attachments'] = $this->get_attachments( $instance );

		$classes = array();

		$classes[] = 'widget-gallery-' . $instance['type'];

		// Due to a bug in the carousel plugin, carousels will be triggered for all tiled galleries that exist on a page
		// with other tiled galleries, regardless of whether or not the widget was set to Carousel mode. The onClick selector
		// is simply too broad, since it was not written with widgets in mind. This special class prevents that behavior, via
		// an override handler in gallery.js
		if( 'carousel' != $instance['link'] && 'slideshow' != $instance['type'] )
			$classes[] = 'no-carousel';
		else
			$classes[] = 'carousel';

		$classes = implode( ' ', $classes );

		if ( 'carousel' == $instance['link'] ) {
			require_once plugin_dir_path( realpath( dirname( __FILE__ ) . '/../carousel/jetpack-carousel.php' ) ) . 'jetpack-carousel.php';

			if ( class_exists( 'Jetpack_Carousel' ) ) {
				// Create new carousel so we can use the enqueue_assets() method. Not ideal, but there is a decent amount
				// of logic in that method that shouldn't be duplicated.
				$carousel = new Jetpack_Carousel();

				// First parameter is $output, which comes from filters, and causes bypass of the asset enqueuing. Passing null is correct.
				$carousel->enqueue_assets( null );
			}
		}

		echo $before_widget . "\n";

		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', $instance['title'] );

		if ( $title )
			echo $before_title . esc_html( $title ) . $after_title . "\n";

		echo '<div class="' . esc_attr( $classes ) . '">' . "\n";

		$method = $instance['type'] . '_widget';

		/**
		 * Allow the width of a gallery to be altered by themes or other code.
		 *
		 * @module widgets
		 *
		 * @since 2.5.0
		 *
		 * @param int self::DEFAULT_WIDTH Default gallery width. Default is 265.
		 * @param string $args Display arguments including before_title, after_title, before_widget, and after_widget.
		 * @param array $instance The settings for the particular instance of the widget.
		 */
		$this->_instance_width = apply_filters( 'gallery_widget_content_width', self::DEFAULT_WIDTH, $args, $instance );

		// Register a filter to modify the tiled_gallery_content_width, so Jetpack_Tiled_Gallery
		// can appropriately size the tiles.
		add_filter( 'tiled_gallery_content_width', array( $this, 'tiled_gallery_content_width' ) );

		if ( method_exists( $this, $method ) )
			echo $this->$method( $args, $instance );

		// Remove the stored $_instance_width, as it is no longer needed
		$this->_instance_width = null;

		// Remove the filter, so any Jetpack_Tiled_Gallery in a post is not affected
		remove_filter( 'tiled_gallery_content_width', array( $this, 'tiled_gallery_content_width' ) );

		echo "\n" . '</div>'; // .widget-gallery-$type

		echo "\n" . $after_widget;

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'gallery' );
	}

	/**
	 * Fetch the images attached to the gallery Widget
	 *
	 * @param array $instance The Widget instance for which you'd like attachments
	 * @return array Array of attachment objects for the Widget in $instance
	 */
	public function get_attachments( $instance ){
		$ids = explode( ',', $instance['ids'] );

		if ( isset( $instance['random'] ) && 'on' == $instance['random'] ) {
			shuffle( $ids );
		}

		$attachments_query = new WP_Query( array(
			'post__in'       => $ids,
			'post_status'    => 'inherit',
			'post_type'      => 'attachment',
			'post_mime_type' => 'image',
			'posts_per_page' => -1,
			'orderby'        => 'post__in',
		) );

		$attachments = $attachments_query->get_posts();

		wp_reset_postdata();

		return $attachments;
	}

	/**
	 * Generate HTML for a rectangular, tiled Widget
	 *
	 * @param array $args Display arguments including before_title, after_title, before_widget, and after_widget.
	 * @param array $instance The Widget instance to generate HTML for
	 * @return string String of HTML representing a rectangular gallery
	 */
	public function rectangular_widget( $args, $instance ) {
		if ( ! class_exists( 'Jetpack_Tiled_Gallery' )
			&& ! class_exists( 'Jetpack_Tiled_Gallery_Layout_Rectangular') ) {
			return;
		}

		$widget_tiled_gallery = new Jetpack_Tiled_Gallery();
		$widget_tiled_gallery->default_scripts_and_styles();

		$layout = new Jetpack_Tiled_Gallery_Layout_Rectangular( $instance['attachments'], $instance['link'], false, 3 );
		return $layout->HTML();
	}

	/**
	 * Generate HTML for a square (grid style) Widget
	 *
	 * @param array $args Display arguments including before_title, after_title, before_widget, and after_widget.
	 * @param array $instance The Widget instance to generate HTML for
	 * @return string String of HTML representing a square gallery
	 */
	public function square_widget( $args, $instance ) {
		if ( ! class_exists( 'Jetpack_Tiled_Gallery' )
			&& ! class_exists( 'Jetpack_Tiled_Gallery_Layout_Square') ) {
			return;
		}

		$widget_tiled_gallery = new Jetpack_Tiled_Gallery();
		$widget_tiled_gallery->default_scripts_and_styles();

		$layout = new Jetpack_Tiled_Gallery_Layout_Square( $instance['attachments'], $instance['link'], false, 3 );
		return $layout->HTML();
	}

	/**
	 * Generate HTML for a circular (grid style) Widget
	 *
	 * @param array $args Display arguments including before_title, after_title, before_widget, and after_widget.
	 * @param array $instance The Widget instance to generate HTML for
	 * @return string String of HTML representing a circular gallery
	 */
	public function circle_widget( $args, $instance ) {
		if ( ! class_exists( 'Jetpack_Tiled_Gallery' )
			&& ! class_exists( 'Jetpack_Tiled_Gallery_Layout_Circle') ) {
			return;
		}

		$widget_tiled_gallery = new Jetpack_Tiled_Gallery();
		$widget_tiled_gallery->default_scripts_and_styles();

		$layout = new Jetpack_Tiled_Gallery_Layout_Circle( $instance['attachments'], $instance['link'], false, 3 );
		return $layout->HTML();
	}

	/**
	 * Generate HTML for a slideshow Widget
	 *
	 * @param array $args Display arguments including before_title, after_title, before_widget, and after_widget.
	 * @param array $instance The Widget instance to generate HTML for
	 * @return string String of HTML representing a slideshow gallery
	 */
	public function slideshow_widget( $args, $instance ) {
		global $content_width;

		require_once plugin_dir_path( realpath( dirname( __FILE__ ) . '/../shortcodes/slideshow.php' ) ) . 'slideshow.php';

		if ( ! class_exists( 'Jetpack_Slideshow_Shortcode' ) )
			return;

		if ( count( $instance['attachments'] ) < 1 )
			return;

		$slideshow = new Jetpack_Slideshow_Shortcode();

		$slideshow->enqueue_scripts();

		$gallery_instance = "widget-" . $args['widget_id'];

		$gallery = array();

		foreach ( $instance['attachments'] as $attachment ) {
			$attachment_image_src = wp_get_attachment_image_src( $attachment->ID, 'full' );
			$attachment_image_src = jetpack_photon_url( $attachment_image_src[0], array( 'w' => $this->_instance_width ) ); // [url, width, height]

			$caption 	= wptexturize( strip_tags( $attachment->post_excerpt ) );

			$gallery[] 	= (object) array(
				'src'     => (string) esc_url_raw( $attachment_image_src ),
				'id'      => (string) $attachment->ID,
				'caption' => (string) $caption,
			);
		}

		$max_width 	= intval( get_option( 'large_size_w' ) );
		$max_height = 175;

		if ( intval( $content_width ) > 0 )
			$max_width = min( intval( $content_width ), $max_width );

		$color = Jetpack_Options::get_option( 'slideshow_background_color', 'black' );
		$autostart = isset( $attr['autostart'] ) ? $attr['autostart'] : true;

		$js_attr = array(
			'gallery'  => $gallery,
			'selector' => $gallery_instance,
			'width'    => $max_width,
			'height'   => $max_height,
			'trans'    => 'fade',
			'color'    => $color,
			'autostart' => $autostart,
		 );

		$html = $slideshow->slideshow_js( $js_attr );

		return $html;
	}

	/**
	 * tiled_gallery_content_width filter
	 *
	 * Used to adjust the content width of Jetpack_Tiled_Gallery's in sidebars
	 *
	 * $this->_instance_width is filtered in widget() and this filter is added then removed in widget()
	 *
	 * @param int $width int The original width value
	 * @return int The filtered width
	 */
	public function tiled_gallery_content_width( $width ) {
		return $this->_instance_width;
	}

	public function form( $instance ) {
		$defaults 		= $this->defaults();
		$allowed_values	= $this->allowed_values();

		$instance 		= wp_parse_args( (array) $instance, $defaults );

		include dirname( __FILE__ ) . '/gallery/templates/form.php';
	}

	public function update( $new_instance, $old_instance ) {
		$instance = $this->sanitize( $new_instance );

		return $instance;
	}

	/**
	 * Sanitize the $instance's values to the set of allowed values. If a value is not acceptable,
	 * it is set to its default.
	 *
	 * Helps keep things nice and secure by whitelisting only allowed values
	 *
	 * @param array $instance The Widget instance to sanitize values for
	 * @return array $instance The Widget instance with values sanitized
	 */
	public function sanitize( $instance ) {
		$allowed_values = $this->allowed_values();
		$defaults 		= $this->defaults();

		foreach ( $instance as $key => $value ) {
			$value = trim( $value );

			if ( isset( $allowed_values[ $key ] ) && $allowed_values[ $key ] && ! array_key_exists( $value, $allowed_values[ $key ] ) ) {
				$instance[ $key ] = $defaults[ $key ];
			} else {
				$instance[ $key ] = sanitize_text_field( $value );
			}
		}

		return $instance;
	}

	/**
	 * Return a multi-dimensional array of allowed values (and their labels) for all widget form
	 * elements
	 *
	 * To allow all values on an input, omit it from the returned array
	 *
	 * @return array Array of allowed values for each option
	 */
	public function allowed_values() {
		$max_columns = 5;

		// Create an associative array of allowed column values. This just automates the generation of
		// column <option>s, from 1 to $max_columns
		$allowed_columns = array_combine( range( 1, $max_columns ), range( 1, $max_columns ) );

		return array(
			'type'	=> array(
				'rectangular'   => __( 'Tiles',        'jetpack' ),
				'square'        => __( 'Square Tiles', 'jetpack' ),
				'circle'        => __( 'Circles',      'jetpack' ),
				'slideshow'     => __( 'Slideshow',    'jetpack' ),
			),
			'columns'	=> $allowed_columns,
			'link'	=> array(
				'carousel'  => __( 'Carousel',         'jetpack' ),
				'post'      => __( 'Attachment Page',  'jetpack' ),
				'file'      => __( 'Media File',       'jetpack' ),
			)
		);
	}

	/**
	 * Return an associative array of default values
	 *
	 * These values are used in new widgets as well as when sanitizing input. If a given value is not allowed,
	 * as defined in allowed_values(), that input is set to the default value defined here.
	 *
	 * @return array Array of default values for the Widget's options
	 */
	public function defaults() {
		return array(
			'title'		=> '',
			'type'		=> 'rectangular',
			'ids'		=> '',
			'columns'	=> 3,
			'link'		=> 'carousel'
		);
	}

	public function enqueue_frontend_scripts() {
		wp_register_script( 'gallery-widget', plugins_url( '/gallery/js/gallery.js', __FILE__ ) );

		wp_enqueue_script( 'gallery-widget' );
	}

	public function enqueue_admin_scripts() {
		global $pagenow;

		if ( 'widgets.php' == $pagenow || 'customize.php' == $pagenow ) {
			wp_enqueue_media();

			wp_enqueue_script( 'gallery-widget-admin', plugins_url( '/gallery/js/admin.js', __FILE__ ), array(
					'media-models',
					'media-views'
				),
				'20150501'
			);

			$js_settings = array(
				'thumbSize' => self::THUMB_SIZE
			);

			wp_localize_script( 'gallery-widget-admin', '_wpGalleryWidgetAdminSettings', $js_settings );
			if( is_rtl() ) {
				wp_enqueue_style( 'gallery-widget-admin', plugins_url( '/gallery/css/rtl/admin-rtl.css', __FILE__ ) );
			} else {
				wp_enqueue_style( 'gallery-widget-admin', plugins_url( '/gallery/css/admin.css', __FILE__ ) );
			}
		}
	}
}

add_action( 'widgets_init', 'jetpack_gallery_widget_init' );

function jetpack_gallery_widget_init() {
	if ( ! method_exists( 'Jetpack', 'is_module_active' ) || Jetpack::is_module_active( 'tiled-gallery' ) )
		register_widget( 'Jetpack_Gallery_Widget' );
}
