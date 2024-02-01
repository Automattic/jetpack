<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync: Default Settings
 *
 */
return array(

	// Once multi-site syncing we store a stack of these in here:
	'sync_sites'         => array(),

	// 0 = no, 1 = yes
	'wccopyship'         => '0',
	'wctagcust'          => '1', // tag contacts with item
	'wctagtransaction'   => '1', // tag transaction with item
	'wctaginvoice'       => '1', // tag invoice with item
	'wctagcoupon'        => '1', // Include any passed coupon code as a tag (dependent on above 3 settings)
	'wctagproductprefix' => 'Product: ',
	'wctagcouponprefix'  => 'Coupon: ',
	'wcinv'              => '0',
	'wcprod'             => '0',
	'wcacc'              => '1',

	// autodeletion
	'auto_trash'         => 'change_status', // do_nothing | change_status | hard_delete_and_log
	'auto_delete'        => 'change_status', // do_nothing | change_status | hard_delete_and_log

	'enable_woo_status_mapping' => 1,

);
