<?php

/**
 * Tests index blocking files are present after initial install (migration 450)
 */
class JPCRM_Files_Cest {

	public function _before( AcceptanceTester $I ) {

		// login as admin (should fire migration on the off chance it's not yet fired)
		$I->loginAsAdmin();
	}

	public function see_templates_index_blocker_files( AcceptanceTester $I ) {
		// attempt to directly load index blocker
		$I->amOnPage( '/wp-content/plugins/crm/templates/index.html' );

		// see that our html comment is present (means our file was created)
		$I->seeInSource( '<!--nope-->' );
	}
}
