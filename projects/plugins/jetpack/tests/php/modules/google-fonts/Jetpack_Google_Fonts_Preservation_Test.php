<?php

require_once JETPACK__PLUGIN_DIR . 'modules/google-fonts/current/load-google-fonts.php';

/**
 * Tests that deactivating the Google Fonts module preserves the fonts that are
 * actually in use so they keep rendering once the module's runtime registration
 * is gone.
 */
class Jetpack_Google_Fonts_Preservation_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function set_up() {
		parent::set_up();
		add_filter( 'pre_jetpack_get_google_fonts_data', array( $this, 'mock_collection' ) );
	}

	public function tear_down() {
		remove_filter( 'pre_jetpack_get_google_fonts_data', array( $this, 'mock_collection' ) );
		WP_Theme_JSON_Resolver::clean_cached_data();
		parent::tear_down();
	}

	/**
	 * A small stand-in for the curated Google Fonts collection.
	 */
	public function mock_collection() {
		return array(
			'fontFamilies' => array(
				array(
					'name'       => 'Roboto',
					'slug'       => 'roboto',
					'fontFamily' => 'Roboto, sans-serif',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Roboto',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'src'        => array( 'https://fonts.gstatic.com/s/roboto/v1/roboto.woff2' ),
						),
					),
				),
				array(
					'name'       => 'Lobster',
					'slug'       => 'lobster',
					'fontFamily' => 'Lobster, cursive',
					'fontFace'   => array(
						array(
							'fontFamily' => 'Lobster',
							'fontStyle'  => 'normal',
							'fontWeight' => '400',
							'src'        => array( 'https://fonts.gstatic.com/s/lobster/v1/lobster.woff2' ),
						),
					),
				),
			),
		);
	}

	/**
	 * Mark a font family as in use by referencing it from the site's global styles.
	 *
	 * @param string $slug Font family slug.
	 */
	private function use_font_in_global_styles( $slug ) {
		$post_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => wp_json_encode(
					array(
						'version'                     => 2,
						'isGlobalStylesUserThemeJSON' => true,
						'styles'                      => array(
							'typography' => array(
								'fontFamily' => "var:preset|font-family|$slug",
							),
						),
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	/**
	 * Read the font family definitions persisted into the user global styles.
	 *
	 * @return array
	 */
	private function get_saved_theme_font_families() {
		WP_Theme_JSON_Resolver::clean_cached_data();
		$raw = WP_Theme_JSON_Resolver::get_user_data()->get_raw_data();
		return $raw['settings']['typography']['fontFamilies']['theme'] ?? array();
	}

	public function test_only_the_in_use_collection_family_is_selected() {
		$this->use_font_in_global_styles( 'roboto' );

		$families = jetpack_get_in_use_google_font_families();

		$this->assertCount( 1, $families );
		$this->assertSame( 'Roboto', $families[0]['name'] );
		$this->assertNotEmpty( $families[0]['fontFace'] );
	}

	public function test_no_fonts_in_use_preserves_nothing() {
		$this->assertSame( array(), jetpack_get_in_use_google_font_families() );
	}

	public function test_deactivation_persists_in_use_font_with_font_face() {
		$this->use_font_in_global_styles( 'roboto' );

		jetpack_unregister_google_fonts();

		$saved = $this->get_saved_theme_font_families();
		$names = wp_list_pluck( $saved, 'name' );

		$this->assertContains( 'Roboto', $names, 'The in-use font should be preserved.' );
		$this->assertNotContains( 'Lobster', $names, 'Fonts that are not in use should not be preserved.' );

		$roboto = $saved[ array_search( 'Roboto', $names, true ) ];
		$this->assertNotEmpty( $roboto['fontFace'], 'The preserved font must keep its @font-face definition.' );
	}

	public function test_preserved_font_is_emitted_by_core() {
		$this->use_font_in_global_styles( 'roboto' );

		jetpack_unregister_google_fonts();
		WP_Theme_JSON_Resolver::clean_cached_data();

		$fonts            = WP_Font_Face_Resolver::get_fonts_from_theme_json();
		$printed_families = array();
		foreach ( $fonts as $font_faces ) {
			if ( isset( $font_faces[0]['font-family'] ) ) {
				$printed_families[] = $font_faces[0]['font-family'];
			}
		}

		$this->assertContains(
			'Roboto',
			$printed_families,
			'Core should print the preserved font once the module is gone.'
		);
	}

	public function test_deactivation_does_not_duplicate_already_saved_font() {
		$this->use_font_in_global_styles( 'roboto' );

		jetpack_unregister_google_fonts();
		jetpack_unregister_google_fonts();

		$saved = $this->get_saved_theme_font_families();
		$names = wp_list_pluck( $saved, 'name' );

		$this->assertCount( 1, array_keys( $names, 'Roboto', true ), 'The preserved font should not be duplicated.' );
	}
}
