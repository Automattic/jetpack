<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: MailPoet Admin class
 * Collects CRM additions to the MailPoet wp-admin UI
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * MailPoet Admin UI class
 */
class Mailpoet_Admin_Integration {


	/**
	 * The single instance of the class.
	 */
	protected static $_instance = null;

	/**
	 * Setup MailPoet
	 */
	public function __construct( ) {

		// Initialise Hooks
		$this->init_hooks();

	}
		

	/**
	 * Main Class Instance.
	 *
	 * Ensures only one instance of Mailpoet_Admin_Integration is loaded or can be loaded.
	 *
	 * @since 2.0
	 * @static
	 * @see 
	 * @return Mailpoet_Admin_Integration main instance
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}


	/**
	 * Initialise Hooks
	 */
	private function init_hooks( ) {

		// Add button to subscriber page 'View CRM Contact'
		// /wp-admin/admin.php?page=mailpoet-subscribers#/stats/{id}

		// Add button column to subscriber list page 'View CRM Contact'
		// /wp-admin/admin.php?page=mailpoet-subscribers#/

	}

}