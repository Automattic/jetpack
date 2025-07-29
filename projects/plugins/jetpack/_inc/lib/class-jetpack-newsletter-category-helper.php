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

	const NEWSLETTER_CATEGORIES_OPTION         = 'wpcom_newsletter_categories';
	const NEWSLETTER_CATEGORIES_ENABLED_OPTION = 'wpcom_newsletter_categories_enabled';

	/**
	 * Return category ID's
	 *
	 * @param array $newsletter_categories An array of id's that could be in a few different forms.
	 * @return array An array of integers
	 *              [123, 456]
	 */
	public static function parse_category_ids( $newsletter_categories ) {
		return $newsletter_categories;
	}

	/**
	 * Return category ID's ready to be saved as an option
	 *
	 * @param array $newsletter_categories An array of id's that could be in a few different forms.
	 * @return array An associated array with term_id keys.
	 *              [{term_id: 123}, {term_id: 456}]
	 */
	public static function prepare_category_ids( $newsletter_categories ) {
		return $newsletter_categories;
	}
}
