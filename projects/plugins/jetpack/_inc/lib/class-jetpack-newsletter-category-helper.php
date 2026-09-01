<?php
/**
 * Contains utilities related to the Jetpack Newsletter Categories.
 *
 * @package automattic/jetpack
 */

/**
 * Jetpack_Newsletter_Category_Helper class
 */
class Jetpack_Newsletter_Category_Helper {

	const NEWSLETTER_CATEGORIES_OPTION = 'wpcom_newsletter_categories';

	/**
	 * Return category ID's
	 *
	 * @return array An array of integers
	 */
	public static function get_category_ids() {
		$newsletter_categories = maybe_unserialize( get_option( 'wpcom_newsletter_categories', array() ) );

		if ( ! is_array( $newsletter_categories ) || empty( $newsletter_categories ) ) {
			return array();
		}

		// Check if it is an array of integers.
		// [123, 456]
		if ( isset( $newsletter_categories[0] ) && is_int( $newsletter_categories[0] ) ) {
			return $newsletter_categories;
		}

		// Check if it is an array of arrays with term_id keys.
		// [{term_id: 123}, {term_id: 456}]
		if ( isset( $newsletter_categories[0] ) && is_array( $newsletter_categories[0] ) && isset( $newsletter_categories[0]['term_id'] ) ) {
			$ids = array();
			foreach ( $newsletter_categories as $category ) {
				if ( isset( $category['term_id'] ) && is_numeric( $category['term_id'] ) ) {
					$ids[] = (int) $category['term_id'];
				}
			}
			return $ids;
		}

		return array();
	}

	/**
	 * Handles category ID's ready to be saved as an option
	 *
	 * @param array $newsletter_categories An array of id's that could be in a few different forms.
	 * @return array|bool An associated array with term_id keys on success, or the boolean result from update_option.
	 *              [{term_id: 123}, {term_id: 456}]
	 */
	public static function save_category_ids( $newsletter_categories ) {
		if ( ! is_array( $newsletter_categories ) || empty( $newsletter_categories ) ) {
			return false;
		}

		$formatted_categories = array();

		// Check if it is an array of integers.
		// [123, 456]
		if ( isset( $newsletter_categories[0] ) && is_numeric( $newsletter_categories[0] ) ) {
			foreach ( $newsletter_categories as $id ) {
				if ( is_numeric( $id ) ) {
					$formatted_categories[] = array( 'term_id' => (int) $id );
				}
			}
		}

		// Check if it is an array of arrays with term_id keys.
		// [{term_id: 123}, {term_id: 456}]
		if ( isset( $newsletter_categories[0] ) && is_array( $newsletter_categories[0] ) && isset( $newsletter_categories[0]['term_id'] ) ) {
			foreach ( $newsletter_categories as $category ) {
				if ( isset( $category['term_id'] ) && is_numeric( $category['term_id'] ) ) {
					$formatted_categories[] = array( 'term_id' => (int) $category['term_id'] );
				}
			}
		}

		if ( empty( $formatted_categories ) ) {
			return false;
		}

		return update_option( self::NEWSLETTER_CATEGORIES_OPTION, $formatted_categories )
			? $formatted_categories
			: false;
	}
}
