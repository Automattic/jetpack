<?php

/**
 * Tests relating to the Activation of our WordPress plugin
 */
class JPCRM_Activation_Cest {

	public function _before( AcceptanceTester $I ) {
		$I->amOnPage( '/' );
		$I->loginAsAdmin();
	}

	// Sometimes WP has update pages to handle
	public function catch_wp_update_pages( AcceptanceTester $I ) {
		try {
			$I->see( 'Administration email verification' );
			$I->click( '#correct-admin-email' );
		} catch ( Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// continue tests
		}
		try {
			$I->see( 'Database Update Required' );
			$I->amOnPage( 'upgrade.php?step=1&amp;backto=%2Fwp-admin%2F' );
		} catch ( Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// continue tests
		}
	}

	public function jpcrm_activation( AcceptanceTester $I ) {
		// If it's installed, activate the plugin
		$I->amOnPluginsPage();
		$I->seePluginInstalled( 'jetpack-crm' );
		$I->activatePlugin( 'jetpack-crm' );

		// Activating the plugin directly loads the welcome wizard, so no need to move pages here.

		// check no activation errors
		$I->dontSeeElement( '#message.error' );

		// The plugin is activated, now we can see the JPCRM set up page
		$I->see( 'Essential Details' );
		$I->see( 'Essentials' );
		$I->see( 'Your Contacts' );
		$I->see( 'Which Extensions?' );
		$I->see( 'Finish' );
	}
}
