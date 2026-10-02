<?php
/**
 * Stand-in for the wpcom billing class `Current_Plan::get_simple_site_specific_features()`
 * reads Simple-site features from. Defined here so the real one is never required — it
 * lives in the wpcom repo, not this one — and so a test can see which shape was asked for.
 *
 * @package automattic/jetpack-plans
 */
class Store_Product_List {

	/**
	 * One entry per call, recording the `$include_available` argument it was given.
	 *
	 * @var bool[]
	 */
	public static $calls = array();

	/**
	 * Record the call and answer in the requested shape.
	 *
	 * @param int  $blog_id           Blog ID (unused).
	 * @param bool $include_available Whether the upgradeable list was asked for.
	 * @return array
	 */
	public static function get_site_specific_features_data( $blog_id = 0, $include_available = true ) {
		self::$calls[] = $include_available;

		$data = array( 'active' => array( 'seo-admin-ui' ) );
		if ( $include_available ) {
			$data['available'] = array( 'some-upgrade' );
		}

		return $data;
	}
}
