<?php
/**
 * Class Jetpack_Recipe_Block
 *
 * @package automattic/jetpack
 */

/**
 * Helper class that lets us add schema attributes dynamically because they are not something that is store with the content.
 * Due to the limitations of wp_kses.
 *
 * @since 7.1.0
 */
class Jetpack_Recipe_Block {

	/**
	 * Adds recipe schema attributes.
	 *
	 * @param array  $attr    Array containing the recipe block attributes.
	 * @param string $content String containing the recipe block content.
	 *
	 * @return string
	 */
	public static function render( $attr, $content ) {
		Jetpack_Gutenberg::load_styles_as_required( 'recipe' );
		return $content;
	}

	/**
	 * Adds recipe hero schema attributes.
	 *
	 * @param array  $attr    Array containing the recipe-hero block attributes.
	 * @param string $content String containing the recipe-hero block content.
	 *
	 * @return string
	 */
	public static function render_hero( $attr, $content ) {
		return $content;
	}

	/**
	 * Adds recipe details schema attributes.
	 *
	 * @param array  $attr    Array containing the recipe-details block attributes.
	 * @param string $content String containing the recipe-details block content.
	 *
	 * @return string
	 */
	public static function render_details( $attr, $content ) {
		Jetpack_Gutenberg::load_styles_as_required( 'recipe-details' );
		return $content;
	}

	/**
	 * Adds recipe ingredients list schema attributes.
	 *
	 * @param array  $attr    Array containing the recipe-ingredients-list block attributes.
	 * @param string $content String containing the recipe-ingredients-list block content.
	 *
	 * @return string
	 */
	public static function render_ingredients_list( $attr, $content ) {
		return $content;
	}

	/**
	 * Adds recipe ingredient item schema attributes.
	 *
	 * @param array  $attr    Array containing the recipe-ingredient-item block attributes.
	 * @param string $content String containing the recipe-ingredient-item block content.
	 *
	 * @return string
	 */
	public static function render_ingredient_item( $attr, $content ) {
		return $content;
	}

	/**
	 * Adds recipe steps schema attributes.
	 *
	 * @param array  $attr    Array containing the recipe-steps block attributes.
	 * @param string $content String containing the recipe-steps block content.
	 *
	 * @return string
	 */
	public static function render_steps( $attr, $content ) {
		return $content;
	}

	/**
	 * Adds recipe step schema attributes.
	 *
	 * @param array  $attr    Array containing the recipe-step block attributes.
	 * @param string $content String containing the recipe-step block content.
	 *
	 * @return string
	 */
	public static function render_step( $attr, $content ) {
		Jetpack_Gutenberg::load_styles_as_required( 'recipe-step' );
		return $content;
	}

	/**
	 * Helper function that lets us determine if a block has any valid attributes.
	 *
	 * @param array $attr Array containing the block attributes.
	 * @param array $omit Array containing the block attributes that we ignore.
	 *
	 * @return string
	 */
	public static function has_attributes( $attr, $omit = array() ) {
		foreach ( $attr as $attribute => $value ) {
			if ( ! in_array( $attribute, $omit, true ) && ! empty( $value ) ) {
				return true;
			}
		}

		return false;
	}
}
