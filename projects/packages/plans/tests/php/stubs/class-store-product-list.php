<?php
/**
 * Stand-in for the WordPress.com billing feature lookup.
 *
 * @package automattic/jetpack-plans
 */
class Store_Product_List {

	/**
	 * Record the call and answer in the requested shape.
	 *
	 * @param int  $blog_id           Blog ID (unused).
	 * @param bool $include_available Whether the upgradeable list was asked for.
	 * @return array
	 */
	public static function get_site_specific_features_data( $blog_id = 0, $include_available = true ) {
		$GLOBALS['jetpack_test_store_product_list_calls'][] = $include_available;

		$data = array( 'active' => array( 'seo-admin-ui' ) );
		if ( $include_available ) {
			$data['available'] = array( 'some-upgrade' );
		}

		return $data;
	}
}
