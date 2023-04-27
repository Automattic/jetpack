<?php

/**
 * Tests relating to the Activation of our WordPress plugin
 */
class JPCRM_Activation_Cest {

	public function _before( AcceptanceTester $I ) {
		$I->amOnPage( '/' );
		$I->loginAsAdmin();
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
