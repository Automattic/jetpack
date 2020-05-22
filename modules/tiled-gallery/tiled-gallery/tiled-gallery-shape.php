<?php
class Jetpack_Tiled_Gallery_Shape {
	static $shapes_used = array();

	public function __construct( $images ) {
		$this->images = $images;
		$this->images_left = count( $images );
	}

	public function sum_ratios( $number_of_images = 3 ) {
		return array_sum( array_slice( wp_list_pluck( $this->images, 'ratio' ), 0, $number_of_images ) );
	}

	public function next_images_are_symmetric() {
		return $this->images_left > 2 && $this->images[0]->ratio == $this->images[2]->ratio;
	}

	public function is_not_as_previous( $n = 1 ) {
		return ! in_array( get_class( $this ), array_slice( self::$shapes_used, -$n ) );
	}

	public function is_wide_theme() {
		return Jetpack::get_content_width() > 1000;
	}

	public function image_is_landscape( $image ) {
		return $image->ratio >= 1 && $image->ratio < 2;
	}

	public function image_is_portrait( $image ) {
		return $image->ratio < 1;
	}

	public function image_is_panoramic( $image ) {
		return $image->ratio >= 2;
	}

	public static function set_last_shape( $last_shape ) {
		self::$shapes_used[] = $last_shape;
	}

	public static function reset_last_shape() {
		self::$shapes_used = array();
	}
}

class Jetpack_Tiled_Gallery_Three extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 1, 1, 1 );

	public function is_possible() {
		$ratio = $this->sum_ratios( 3 );
		$has_enough_images = $this->images_left >= 3 && ! in_array( $this->images_left, array( 4, 6 ) );
		return $has_enough_images && $this->is_not_as_previous( 3 ) &&
			( ( $ratio < 2.5 ) || ( $ratio < 5 && $this->next_images_are_symmetric() ) || $this->is_wide_theme() );
	}
}

class Jetpack_Tiled_Gallery_Four extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 1, 1, 1, 1 );

	public function is_possible() {
		return $this->is_not_as_previous() &&
			(
				( $this->sum_ratios( 4 ) < 3.5 && $this->images_left > 5 ) ||
				( $this->sum_ratios( 4 ) < 7 && $this->images_left == 4 )
			);
	}
}

class Jetpack_Tiled_Gallery_Five extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 1, 1, 1, 1, 1 );

	public function is_possible() {
		return $this->is_wide_theme() && $this->is_not_as_previous() && $this->sum_ratios( 5 ) < 5 &&
			( $this->images_left == 5 || ( $this->images_left != 10 && $this->images_left > 6 ) );
	}
}

class Jetpack_Tiled_Gallery_Two_One extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 2, 1 );

	public function is_possible() {
		return $this->is_not_as_previous( 3 ) && $this->images_left >= 2 &&
			$this->images[2]->ratio < 1.6 && $this->images[0]->ratio >= 0.9 && $this->images[0]->ratio < 2.0 && $this->images[1]->ratio >= 0.9 && $this->images[1]->ratio < 2.0;
	}
}

class Jetpack_Tiled_Gallery_One_Two extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 1, 2 );

	public function is_possible() {
		return $this->is_not_as_previous( 3 ) && $this->images_left >= 2 &&
			$this->images[0]->ratio < 1.6 && $this->images[1]->ratio >= 0.9 && $this->images[1]->ratio < 2.0 && $this->images[2]->ratio >= 0.9 && $this->images[2]->ratio < 2.0;
	}
}

class Jetpack_Tiled_Gallery_One_Three extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 1, 3 );

	public function is_possible() {
		return $this->is_not_as_previous( 3 ) && $this->images_left > 3 &&
			$this->image_is_portrait( $this->images[0] ) &&
			$this->image_is_landscape( $this->images[1] ) &&
			$this->image_is_landscape( $this->images[2] ) &&
			$this->image_is_landscape( $this->images[3] );
	}
}

class Jetpack_Tiled_Gallery_Three_One extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 3, 1 );

	public function is_possible() {
		return $this->is_not_as_previous( 3 ) && $this->images_left > 3 &&
			$this->image_is_portrait( $this->images[3] ) &&
			$this->image_is_landscape( $this->images[0] ) &&
			$this->image_is_landscape( $this->images[1] ) &&
			$this->image_is_landscape( $this->images[2] );
	}
}

class Jetpack_Tiled_Gallery_Panoramic extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 1 );

	public function is_possible() {
		return $this->image_is_panoramic( $this->images[0] );
	}
}

class Jetpack_Tiled_Gallery_Symmetric_Row extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 1, 2, 1 );

	public function is_possible() {
		return $this->is_not_as_previous( 5 ) &&
			$this->images_left > 3 &&
			$this->images_left != 5 &&
			$this->image_is_portrait( $this->images[0] ) &&
			$this->image_is_landscape( $this->images[1] ) &&
			$this->image_is_landscape( $this->images[2] ) &&
			$this->image_is_portrait( $this->images[3] );
	}
}
class Jetpack_Tiled_Gallery_Reverse_Symmetric_Row extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 2, 1, 2 );

	public function is_possible() {
		return $this->is_not_as_previous( 5 ) && $this->images_left > 15 &&
			$this->image_is_landscape( $this->images[0] ) &&
			$this->image_is_landscape( $this->images[1] ) &&
			$this->image_is_portrait( $this->images[2] ) &&
			$this->image_is_landscape( $this->images[3] ) &&
			$this->image_is_landscape( $this->images[4] );
	}
}

class Jetpack_Tiled_Gallery_Long_Symmetric_Row extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array( 3, 1, 3 );

	public function is_possible() {
		return $this->is_not_as_previous( 5 ) && $this->images_left > 15 &&
			$this->image_is_landscape( $this->images[0] ) &&
			$this->image_is_landscape( $this->images[1] ) &&
			$this->image_is_landscape( $this->images[2] ) &&
			$this->image_is_portrait( $this->images[3] ) &&
			$this->image_is_landscape( $this->images[4] ) &&
			$this->image_is_landscape( $this->images[5] ) &&
			$this->image_is_landscape( $this->images[6] );
	}
}

class Jetpack_Tiled_Gallery_Three_Columns extends Jetpack_Tiled_Gallery_Shape {
	public $shape = array();

	public function __construct( $images ) {
		parent::__construct( $images );

		$total_ratio = $this->sum_ratios( $this->images_left );
		$approximate_column_ratio = $total_ratio / 3;
		$column_one_images = $column_two_images = $column_three_images = $sum = 0;

		foreach ( $this->images as $image ) {
			if ( $sum <= $approximate_column_ratio ) {
				$column_one_images++;
			}

			if ( $sum > $approximate_column_ratio && $sum <= 2 * $approximate_column_ratio ) {
				$column_two_images++;
			}
			$sum += $image->ratio;
		}

		$column_three_images = $this->images_left - $column_two_images - $column_one_images;

		if ( $column_one_images ) {
			$this->shape[] = $column_one_images;
		}

		if ( $column_two_images ) {
			$this->shape[] = $column_two_images;
		}

		if ( $column_three_images ) {
			$this->shape[] = $column_three_images;
		}
	}

	public function is_possible() {
		return ! empty( $this->shape );
	}
}
