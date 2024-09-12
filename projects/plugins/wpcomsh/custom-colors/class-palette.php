<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Custom pallette control.
 */
class Palette {

	/**
	 * Pallete data storage.
	 *
	 * @var array
	 */
	protected $data;

	/**
	 * Constructor
	 *
	 * @param ?array $initial_data initial pallette data.
	 */
	public function __construct( $initial_data = null ) {
		if ( $initial_data ) {
			foreach ( $initial_data as $key => $value ) {
				$this->{$key} = $value;
			}
		}
	}

	/**
	 * Data setter method.
	 *
	 * @param string $member the data key.
	 * @param mixed  $value the data value.
	 */
	public function __set( $member, $value ) {
		$this->data[ $member ] = $value;

		if ( 'colors' === $member ) {
			$this->format_colors();
		}
	}

	/**
	 * Data getter method.
	 *
	 * @param string $member the data key.
	 * @return mixed $value
	 */
	public function __get( $member ) {
		return $this->data[ $member ];
	}

	/**
	 * A search method for palettes. Specify an ID or a set of colors to find the matching palette.
	 *
	 * @param array{id?:int,colors?:array} $args initial arguments.
	 * @return Palette|false
	 */
	public static function get( $args = array() ) {
		$defaults = array(
			'id'     => 0,
			'colors' => array(),
		);

		$args           = wp_parse_args( $args, $defaults );
		$args['id']     = intval( $args['id'] );
		$args['colors'] = (array) $args['colors'];

		if ( ! $args['id'] && ! empty( $args['colors'] ) ) {
			foreach ( $args['colors'] as $color_index => $color_code ) {
				$args['colors'][ $color_index ] = Colors_Manager::normalize_color( $color_code );
			}

			$args['colors'] = implode( ',', array_unique( $args['colors'] ) );

			$palette_by_colors = Colors_API::call( 'palettes', array( 'colors' => $args['colors'] ) );
			if ( $palette_by_colors ) {
				$args['id'] = $palette_by_colors['id'];
			}
		}

		if ( $args['id'] ) {
			$palette_data = wp_cache_get( 'palette:' . $args['id'], 'colors' );

			if ( false === $palette_data ) {
				$palette_data = Colors_API::call( 'palettes', array(), $args['id'] );
				wp_cache_set( 'palette:' . $args['id'], $palette_data, 'colors' );
			}

			if ( $palette_data ) {
				return new Palette( $palette_data );
			}
		}

		return false;
	}

	/**
	 * COLOURLovers formats color sets as arrays of [hex=>, width=>] pairs, but we only care about the hex.
	 * This function assigns the colors in the array to the five color roles.
	 */
	public function format_colors() {
		if ( is_string( $this->data['colors'] ) ) {
			$this->data['colors'] = json_decode( $this->data['colors'], true );
		} elseif ( is_array( $this->data['colors'] ) && isset( $this->data['colors']['bg'] ) ) {
			return;
		}

		$colors = array();

		foreach ( array( 'bg', 'txt', 'link', 'fg1', 'fg2' ) as $color_index => $color_key ) {
			if ( count( $this->data['colors'] ) === $color_index ) {
				break;
			}

			$colors[ $color_key ] = $this->data['colors'][ $color_index ]['hex'];
		}

		$this->data['colors'] = $colors;
	}
}
