<?php

class WP_Test_Jetpack_Blogging_Prompts extends WP_UnitTestCase {
	public function test_jetpack_get_mag16_locale() {
		$valid_locales   = array( 'ar', 'zh_cn', 'tr', 'zh_tw', 'nl', 'en', 'fr', 'de', 'he', 'id', 'it', 'ja', 'ko', 'pt_br', 'ru', 'es', 'sv' );
		$locales_to_test = array( 'zh_cn', 'pt', 'fr', 'fr_be', 'en_us', 'nl_be' );

		foreach ( $locales_to_test as $locale ) {
			switch_to_locale( $locale );
			$site_locale = jetpack_get_mag16_locale();
			$this->assertContains( strtolower( $site_locale ), $valid_locales );
		}
	}
}
