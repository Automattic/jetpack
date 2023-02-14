<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Segment Conditions
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * WooSync Segment Conditions class
 */
class Woo_Sync_Segment_Conditions {

	/**
	 * An array of our segment condition class instances
	 */
	public $conditions = array();

	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Setup Segment conditions
	 */
	public function __construct( ) {

		// Require segment conditions when jpcrm is ready
    	add_action( 'jpcrm_post_init', array( $this, 'require_segment_conditions'), 1 );

	}
		
	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Woo_Sync_Segment_Conditions is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Woo_Sync_Segment_Conditions main instance
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}



	/**
	 * Require segment conditions
	 */
	public function require_segment_conditions(){

		// is woo customer
		require_once( JPCRM_WOO_SYNC_ROOT_PATH . 'includes/segment-conditions/class-segment-condition-woo-customer.php' );
		$this->conditions['is_woo_customer'] = new \Segment_Condition_Woo_Customer();

		// woo order count
		require_once( JPCRM_WOO_SYNC_ROOT_PATH . 'includes/segment-conditions/class-segment-condition-woo-order-count.php' );
		$this->conditions['woo_order_count'] = new \Segment_Condition_Woo_Order_Count();

	}

}