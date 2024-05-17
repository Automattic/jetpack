<?php

/**
 * Tests of our various Admin Views
 */
class JPCRM_Admin_Views_Cest {

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_jpcrm_wp_menu( AcceptanceTester $I ) {
		$I->amOnPage( 'wp-admin' );
		$I->see( 'Jetpack CRM', '.wp-menu-name' );
	}

	public function see_jpcrm_top_menu( AcceptanceTester $I ) {

		$I->gotoAdminPage( 'dashboard' );

		$expectedAdminMenus = array(
			'Dashboard',
			'Contacts',
			'Tools',
		);

		foreach ( $expectedAdminMenus as $menu ) {
			$I->see( $menu, '#jpcrm-top-menu .item' );
		}
	}
	public function see_jpcrm_dashboard( AcceptanceTester $I ) {
		$I->gotoAdminPage( 'dashboard' );

		$expectedBlocks = array(
			'Sales Funnel',
			'Revenue Chart',
			// 'Contacts added per month',
			// 'Total Contacts',
			// 'Total Leads',
			// 'Total Customers',
			// 'Total Transactions',
				'Latest Contacts',
			'Recent Activity',
		);

		foreach ( $expectedBlocks as $block_title ) {
			$I->see( $block_title, '.jpcrm-dashcard-header h4' );
		}
	}

	public function see_jpcrm_settings( AcceptanceTester $I ) {

		$I->goToPageViaSlug( 'settings' );

		$I->see( 'General Settings' );
	}
}
