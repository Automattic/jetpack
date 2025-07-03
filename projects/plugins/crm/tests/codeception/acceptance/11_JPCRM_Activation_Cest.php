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

	public function test_single_plugin_activation_shows_wizard( AcceptanceTester $I ) {
		$I->amOnPluginsPage();

		$I->seePluginInstalled( 'jetpack-crm' );
		$I->activatePlugin( 'jetpack-crm' );

		// Check no activation errors and wizard is shown
		$I->dontSeeElement( '#message.error' );
		$this->assertWizardIsShown( $I );
	}

	/**
	 * Assert that the wizard UI is currently shown
	 */
	private function assertWizardIsShown( AcceptanceTester $I ) {
		$I->see( 'Essential Details' );
		$I->see( 'Essentials' );
		$I->see( 'Your Contacts' );
		$I->see( 'Which Extensions?' );
		$I->see( 'Finish' );
	}

	/**
	 * Assert that the wizard UI is not shown
	 */
	private function assertWizardIsNotShown( AcceptanceTester $I ) {
		$I->dontSee( 'Essential Details' );
		$I->dontSee( 'Essentials' );
		$I->dontSee( 'Your Contacts' );
		$I->dontSee( 'Which Extensions?' );
		$I->dontSee( 'Finish' );
	}
}
