<?php

/**
 * Contact related tests
 */
class JPCRM_Extensions_Cest {

	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	public function see_modules_page( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'modules' );
		$I->see( 'Core Modules', '#core-modules' );
	}

	public function see_extensions_page( AcceptanceTester $I ) {
		$I->goToPageViaSlug( 'extensions' );
		$I->see( 'Premium Extensions', '.box-title' );
	}
}
