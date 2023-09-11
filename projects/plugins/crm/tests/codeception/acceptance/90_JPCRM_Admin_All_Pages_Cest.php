<?php

/**
 * Load all the pages!
 */
class JPCRM_Admin_All_Pages_Cest {

	// make sure we are logged in
	public function _before( AcceptanceTester $I ) {
		$I->loginAsAdmin();
	}

	/**
	 * Page Checker
	 * Loads all the slugs (and test for php errors!)
	 * ...this is a temporary hackaround/test, it might not make sense as an acceptence test?
	 *
	 * @param AcceptanceTester $I
	 */
	public function see_http_responses_200( AcceptanceTester $I ) {

		// retrieve slugs
		$slugs = $I->getSlugs();

		// cycle through the pages
		foreach ( $slugs as $slug => $page ) {

			// load page
			$I->goToPageViaSlug( $slug );

			$I->seeResponseCodeIs( 200 );
		}
	}
}
