<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tonesque
 * Grab an average color representation from an image.
 *
 * @author Automattic
 * @author Matias Ventura
 * @package automattic/jetpack
 */

/**
 * Color representation class.
 */
class Tonesque {
	/**
	 * Image URL.
	 *
	 * @var string
	 */
	private $image_url = '';
	/**
	 * Image identifier representing the image.
	 *
	 * @var null|object
	 */
	private $image_obj = null;
	/**
	 * Color code.
	 *
	 * @var string
	 */
	private $color = '';

	/**
	 * Constructor.
	 *
	 * @param string $image_url Image URL.
	 */
	public function __construct( $image_url ) {
		if ( ! class_exists( 'Jetpack_Color' ) ) {
			require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class.color.php';
		}

		$this->image_url = esc_url_raw( $image_url );
		$this->image_url = trim( $this->image_url );
		/**
		 * Allows any image URL to be passed in for $this->image_url.
		 *
		 * @module theme-tools
		 *
		 * @since 2.5.0
		 *
		 * @param string $image_url The URL to any image
		 */
		$this->image_url = apply_filters( 'tonesque_image_url', $this->image_url );

		$this->image_obj = self::imagecreatefromurl( $this->image_url );
	}

	/**
	 * Get an image object from a URL.
	 *
	 * @param string $image_url Image URL.
	 *
	 * @return object|bool Image object or false if the image could not be loaded.
	 */
	public static function imagecreatefromurl( $image_url ) {
		$data = null;

		// If it's a URL.
		if ( preg_match( '#^https?://#i', $image_url ) ) {
			// If it's a url pointing to a local media library url.
			$content_url = content_url();
			$_image_url  = set_url_scheme( $image_url );
			if ( wp_startswith( $_image_url, $content_url ) ) {
				$_image_path = str_replace( $content_url, WP_CONTENT_DIR, $_image_url );
				if ( file_exists( $_image_path ) ) {
					$filetype = wp_check_filetype( $_image_path );
					$type     = $filetype['type'];

					if ( wp_startswith( $type, 'image/' ) ) {
						$data = file_get_contents( $_image_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
					}
				}
			}

			if ( empty( $data ) ) {
				$response = wp_safe_remote_get( $image_url );
				if ( is_wp_error( $response ) ) {
					return false;
				}
				$data = wp_remote_retrieve_body( $response );
			}
		}

		// If it's a local path in our WordPress install.
		if ( file_exists( $image_url ) ) {
			$filetype = wp_check_filetype( $image_url );
			$type     = $filetype['type'];

			if ( wp_startswith( $type, 'image/' ) ) {
				$data = file_get_contents( $image_url ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			}
		}

		// Now turn it into an image and return it.
		return imagecreatefromstring( $data );
	}

	/**
	 * Construct object from image.
	 *
	 * @param string $type Type (hex, rgb, hsv) (optional).
	 *
	 * @return string|bool color as a string formatted as $type or false if the image could not be loaded.
	 */
	public function color( $type = 'hex' ) {
		// Bail if there is no image to work with.
		if ( ! $this->image_obj ) {
			return false;
		}

		// Finds dominant color.
		$color = self::grab_color();
		// Passes value to Color class.
		return self::get_color( $color, $type );
	}

	/**
	 * Grabs the color index for each of five sample points of the image
	 *
	 * @param string $type can be 'index' or 'hex'.
	 *
	 * @return array|false color indices or false if the image could not be loaded.
	 */
	public function grab_points( $type = 'index' ) {
		$img = $this->image_obj;
		if ( ! $img ) {
			return false;
		}

		$height = imagesy( $img );
		$width  = imagesx( $img );

		/*
		 * Sample five points in the image
		 * based on rule of thirds and center.
		 */
		$topy    = round( $height / 3 );
		$bottomy = round( ( $height / 3 ) * 2 );
		$leftx   = round( $width / 3 );
		$rightx  = round( ( $width / 3 ) * 2 );
		$centery = round( $height / 2 );
		$centerx = round( $width / 2 );

		// Cast those colors into an array.
		$points = array(
			imagecolorat( $img, $leftx, $topy ),
			imagecolorat( $img, $rightx, $topy ),
			imagecolorat( $img, $leftx, $bottomy ),
			imagecolorat( $img, $rightx, $bottomy ),
			imagecolorat( $img, $centerx, $centery ),
		);

		if ( 'hex' === $type ) {
			foreach ( $points as $i => $p ) {
				$c            = imagecolorsforindex( $img, $p );
				$points[ $i ] = self::get_color(
					array(
						'r' => $c['red'],
						'g' => $c['green'],
						'b' => $c['blue'],
					),
					'hex'
				);
			}
		}

		return $points;
	}

	/**
	 * Finds the average color of the image based on five sample points
	 *
	 * @return array|bool array with rgb color or false if the image could not be loaded.
	 */
	public function grab_color() {
		$img = $this->image_obj;
		if ( ! $img ) {
			return false;
		}

		$rgb = self::grab_points();

		$r = array();
		$g = array();
		$b = array();

		/*
		 * Process the color points
		 * Find the average representation
		 */
		foreach ( $rgb as $color ) {
			$index = imagecolorsforindex( $img, $color );
			$r[]   = $index['red'];
			$g[]   = $index['green'];
			$b[]   = $index['blue'];
		}
		$red   = round( array_sum( $r ) / 5 );
		$green = round( array_sum( $g ) / 5 );
		$blue  = round( array_sum( $b ) / 5 );

		// The average color of the image as rgb array.
		$color = array(
			'r' => $red,
			'g' => $green,
			'b' => $blue,
		);

		return $color;
	}

	/**
	 * Get a Color object using /lib class.color
	 * Convert to appropriate type
	 *
	 * @param string $color Color code.
	 * @param string $type  Color type (rgb, hex, hsv).
	 *
	 * @return string
	 */
	public function get_color( $color, $type ) {
		$c           = new Jetpack_Color( $color, 'rgb' );
		$this->color = $c;

		switch ( $type ) {
			case 'rgb':
				$color = implode( ',', $c->toRgbInt() );
				break;
			case 'hex':
				$color = $c->toHex();
				break;
			case 'hsv':
				$color = implode( ',', $c->toHsvInt() );
				break;
			default:
				return $c->toHex();
		}

		return $color;
	}

	/**
	 *
	 * Checks contrast against main color
	 * Gives either black or white for using with opacity
	 *
	 * @return string|bool Returns black or white or false if the image could not be loaded.
	 */
	public function contrast() {
		if ( ! $this->color ) {
			return false;
		}

		$c = $this->color->getMaxContrastColor();
		return implode( ',', $c->toRgbInt() );
	}
}
