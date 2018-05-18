<?php

class Jetpack_Geo_Locate {
	private static $instance;

	static public function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Geo_Locate;
		}

		return self::$instance;
	}

	/**
	 * This is mostly just used for testing purposes.
	 */
	static public function reset_instance() {
		self::$instance = null;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'wordpress_init' ) );
		add_action( 'wp_head', array( $this, 'wp_head' ) );
		add_filter( 'the_content', array( $this, 'the_content_microformat' ) );
		add_filter( 'the_content', array( $this, 'the_content_location_display' ), 15, 1 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		$this->register_rss_hooks();
	}

	/**
	 * Register support for the geo-location feature on pages and posts.  Register the meta
	 * fields managed by this plugin so that they are properly sanitized during save.
	 */
	public function wordpress_init() {
		add_post_type_support( 'post', 'geo-location' );
		add_post_type_support( 'page', 'geo-location' );

		register_meta(
			'post',
			'geo_public',
			array(
				'sanitize_callback' => array( $this, 'sanitize_public' ),
				'type'              => 'string',
				'single'            => true,
			)
		);

		register_meta(
			'post',
			'geo_latitude',
			array(
				'sanitize_callback' => array( $this, 'sanitize_coordinate' ),
				'type'              => 'float',
				'single'            => true,
			)
		);

		register_meta(
			'post',
			'geo_longitude',
			array(
				'sanitize_callback' => array( $this, 'sanitize_coordinate' ),
				'type'              => 'float',
				'single'            => true,
			)
		);

		register_meta(
			'post',
			'geo_address',
			array(
				'sanitize_callback' => 'sanitize_text_field',
				'type'              => 'string',
				'single'            => true,
			)
		);
	}

	/**
	 * Filter "public" input to always be either 1 or 0.
	 *
	 * @param mixed $public
	 *
	 * @return int
	 */
	public function sanitize_public( $public ) {
		return absint( $public ) ? 1 : 0;
	}

	/**
	 * Filter geo coordinates and normalize them to floats with 7 digits of precision.
	 *
	 * @param mixed $coordinate
	 *
	 * @return float|null
	 */
	public function sanitize_coordinate( $coordinate ) {
		if ( ! $coordinate ) {
			return null;
		}

		return round( (float) $coordinate, 7 );
	}

	/**
	 * Render geo.position and ICBM meta tags with public geo meta values when rendering
	 * a single post.
	 */
	function wp_head() {
		if ( ! $this->is_single() ) {
			return;
		}

		global $post;

		$meta_values = $this->get_meta_values( $post->ID );

		if ( ! $meta_values['is_public'] ) {
			return;
		}

		echo  "\n<!-- Jetpack Geo-location Tags -->\n";

		printf(
			'<meta name="geo.position" content="%s:%s" />' . PHP_EOL,
			esc_attr( $meta_values['latitude'] ),
			esc_attr( $meta_values['longitude'] )
		);

		printf(
			'<meta name="ICBM" content="%s, %s" />' . PHP_EOL,
			esc_attr( $meta_values['latitude'] ),
			esc_attr( $meta_values['longitude'] )
		);

		echo  "\n<!-- End Jetpack Geo-location Tags -->\n";
	}

	/**
	 * Append public meta values in the Geo microformat (https://en.wikipedia.org/wiki/Geo_(microformat)
	 * to the supplied content.
	 *
	 * @param string $content
	 *
	 * @return string
	 */
	public function the_content_microformat( $content ) {
		global $post;

		if ( ! $post || $this->is_feed() || $this->is_currently_excerpt_filter() ) {
			return $content;
		}

		$meta_values = $this->get_meta_values( $post->ID );

		if ( ! $meta_values['is_public'] ) {
			return $content;
		}

		$microformat = sprintf(
			'<div id="geo-post-%d" class="geo geo-post" style="display: none">',
			esc_attr( $post->ID )
		);

		$microformat .= sprintf(
			'<span class="latitude">%s</span>',
			esc_html( $meta_values['latitude'] )
		);

		$microformat .= sprintf(
			'<span class="longitude">%s</span>',
			esc_html( $meta_values['longitude'] )
		);

		$microformat .= '</div>';

		return $content . $microformat;
	}

	/**
	 * Register a range of hooks for integrating geo data with various feeds.
	 */
	public function register_rss_hooks() {
		add_action( 'rss2_ns', array( $this, 'rss_namespace' ) );
		add_action( 'atom_ns', array( $this, 'rss_namespace' ) );
		add_action( 'rdf_ns', array( $this, 'rss_namespace' ) );
		add_action( 'rss_item', array( $this, 'rss_item' ) );
		add_action( 'rss2_item', array( $this, 'rss_item' ) );
		add_action( 'atom_entry', array( $this, 'rss_item' ) );
		add_action( 'rdf_item', array( $this, 'rss_item' ) );
	}

	/**
	 * Add the georss namespace during RSS generation.
	 */
	public function rss_namespace() {
		echo 'xmlns:georss="http://www.georss.org/georss" xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#" ';
	}

	/**
	 * Output georss data for RSS items, assuming we have data for the currently rendered post and
	 * that data as marked as public.
	 */
	public function rss_item() {
		global $post;

		$meta_values = $this->get_meta_values( $post->ID );

		if ( ! $meta_values['is_public'] ) {
			return;
		}

		printf(
			"\t<georss:point>%s %s</georss:point>\n",
			ent2ncr( esc_html( $meta_values['latitude'] ) ),
			ent2ncr( esc_html( $meta_values['longitude'] ) )
		);

		printf( "\t\t<geo:lat>%s</geo:lat>\n", ent2ncr( esc_html( $meta_values['latitude'] ) ) );
		printf( "\t\t<geo:long>%s</geo:long>\n", ent2ncr( esc_html( $meta_values['longitude'] ) ) );
	}

	/**
	 * Enqueue CSS for rendering post flair with geo-location.
	 */
	public function enqueue_scripts() {
		wp_enqueue_style( 'dashicons' );
	}

	/**
	 * If we're rendering a single post and public geo-location data is available for it,
	 * include the human-friendly location label in the output.
	 *
	 * @param string $html
	 *
	 * @return string
	 */
	public function the_content_location_display( $content ) {
		global $post;

		if ( ! $post || ! $this->is_single() ) {
			return $content;
		}

		$meta_values = $this->get_meta_values( $post->ID );

		if ( ! $meta_values['is_public'] ) {
			return $content;
		}

		// If the location has not been labeled, do not show the location
		if ( ! $meta_values['label'] ) {
			return $content;
		}

		$content .= '<div class="post-geo-location-label geo-chip">';
		$content .= '<span class="dashicons dashicons-location" style="vertical-align: text-top;"></span> ';
		$content .= esc_html( $meta_values['label'] );
		$content .= '</div>';

		return $content;
	}

	/**
	 * This method always returns an array with the following structure:
	 *
	 * array(is_public => bool, latitude => float, longitude => float, label => string, is_populated => bool)
	 *
	 * So, regardless of whether your post actually has values in postmeta for the geo-location fields,
	 * you can be sure that you can reference those array keys in calling code without having to juggle
	 * isset(), array_key_exists(), etc.
	 *
	 * Mocking this method during testing can also be useful for testing output and logic in various
	 * hook functions.
	 *
	 * @param integer $post_id
	 *
	 * @return array A predictably structured array representing the meta values for the supplied post ID.
	 */
	public function get_meta_values( $post_id ) {
		$meta_values = array(
			'is_public'    => (bool) $this->sanitize_public( $this->get_meta_value( $post_id, 'public' ) ),
			'latitude'     => $this->sanitize_coordinate( $this->get_meta_value( $post_id, 'latitude' ) ),
			'longitude'    => $this->sanitize_coordinate( $this->get_meta_value( $post_id, 'longitude' ) ),
			'label'        => trim( $this->get_meta_value( $post_id, 'address' ) ),
			'is_populated' => false,
		);

		if ( $meta_values['latitude'] && $meta_values['longitude'] && $meta_values['label'] ) {
			$meta_values['is_populated'] = true;
		}

		return $meta_values;
	}

	/**
	 * This function wraps get_post_meta() to enable us to keep the "geo_" prefix isolated to a single
	 * location in the code and to assist in mocking during testing.
	 *
	 * @param integer $post_id
	 * @param string $meta_field_name
	 *
	 * @return mixed
	 */
	public function get_meta_value( $post_id, $meta_field_name ) {
		return get_post_meta( $post_id, 'geo_' . $meta_field_name, true );
	}

	/**
	 * Simple wrapper for testing purposes.
	 *
	 * @return bool
	 */
	public function is_single() {
		return is_single();
	}

	/**
	 * Simple wrapper for testing purposes.
	 *
	 * @return bool
	 */
	public function is_feed() {
		return is_feed();
	}

	/**
	 * Check to see if the current filter is the get_the_excerpt filter.
	 *
	 * @return bool
	 */
	public function is_currently_excerpt_filter() {
		if ( isset( $GLOBALS['wp_current_filter'] ) ) {
			return false;
		}

		$current_filters = (array) $GLOBALS['wp_current_filter'];

		return in_array( 'get_the_excerpt', $current_filters );
	}
}

Jetpack_Geo_Locate::init();
