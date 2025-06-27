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

		// Click the activate link for jetpack-crm directly
		$I->click( 'Activate', array( 'css' => 'tr[data-slug="jetpack-crm"] .activate a' ) );

		// Check no activation errors and wizard is shown
		$I->dontSeeElement( '#message.error' );
		$this->assertWizardIsShown( $I );
	}

	public function test_bulk_plugin_activation_skips_wizard( AcceptanceTester $I ) {
		$I->amOnPluginsPage();

		// Activate multiple plugins (even if it's just this one)
		$I->checkOption( 'input[name="checked[]"][value="jetpack-crm/jetpack-crm.php"]' );
		$I->selectOption( 'action', 'activate-selected' );
		$I->click( 'Apply' );

		// Should stay on plugins page, no wizard redirect
		$I->seeInCurrentUrl( 'plugins.php' );
		$I->see( 'Selected plugins activated.' );

		// Verify no wizard is shown
		$this->assertWizardIsNotShown( $I );
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
