<?php

/**
 * Tests to check the deactivation, activation the core plugin and the extension plugins
 */
class JPCRM_Deactivation_Activation_Cest {

	private $plugin_slug = 'jetpack-crm';

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function jpcrm_deactivation( AcceptanceTester $I ) {
		$I->amOnPluginsPage();

		$I->seePluginActivated( $this->plugin_slug );
		$I->deactivatePlugin( $this->plugin_slug );

		$I->see( 'Before you go' );
		$I->seeInSource( 'https://forms.gle/q5KjMBytni3kfFco7' );
		$I->see( 'Not right now' );

		$I->click( 'Not right now' );
		$I->seeInCurrentUrl( '/plugins.php' );
		$I->see( 'Plugins' );
	}

	public function jpcrm_force_wizard( AcceptanceTester $I ) {
		$I->amOnPluginsPage();
		// Plugin should be deactivated
		$I->seePluginDeactivated( $this->plugin_slug );
		$I->activatePlugin( $this->plugin_slug );

		$I->gotoAdminPage( 'dashboard', '&jpcrm_force_wizard=1' );
		$I->see( 'Essential Details' );
		$I->see( 'Essentials' );
		$I->see( 'Your Contacts' );
		$I->see( 'Which Extensions?' );
	}

	public function jpcrm_is_activated( AcceptanceTester $I ) {
		$I->amOnPluginsPage();
		$I->seePluginActivated( $this->plugin_slug );

		// Check that Jetpack CRM menu is there
		$I->amOnPage( 'wp-admin' );
		$I->see( 'Jetpack CRM', '.wp-menu-name' );
	}
}
