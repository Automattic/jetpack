<?php

/**
 * Tests relating to the WordPress installation
 */
class WP_Installation_Cest {

	/**
	 * Have database access
	 * (can see the option `blogname`)
	 */
	public function has_database_access( AcceptanceTester $I ) {
		$I->seeInDatabase(
			'wp_options',
			array(
				'option_name'  => 'blogname',
				'option_value' => 'Jetpack CRM Testing Site',
			)
		);
	}

	/**
	 * PHP server is up
	 * / loads
	 */
	public function the_server_is_running( AcceptanceTester $I ) {
		$I->amOnPage( '/' );
		$I->seeResponseCodeIsSuccessful();
		$I->see( 'Jetpack CRM Testing Site' );
	}

	/**
	 * Has WP installed
	 */
	public function has_wp_admin_access( AcceptanceTester $I ) {
		$I->amOnPage( '/wp-admin' );
		$I->seeResponseCodeIsSuccessful();
		$I->seeInCurrentUrl( 'wp-login.php' );
	}

	/**
	 * Able to login as admin
	 */
	public function wp_login_as_admin( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}
}
