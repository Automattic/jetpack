<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';

use PHPUnit\Framework\Attributes\DataProvider;

class Jetpack_Subscribe_Modal_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var string
	 */
	private $previous_stylesheet;

	public function set_up() {
		parent::set_up();
		$this->previous_stylesheet = get_stylesheet();
	}

	public function tear_down() {
		remove_all_filters( 'wp_theme_json_data_user' );
		switch_theme( $this->previous_stylesheet );
		WP_Theme_JSON_Resolver::clean_cached_data();
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param string $theme    Theme to activate.
	 * @param array  $styles   The owner's Global Styles, as saved in the site editor.
	 * @param string $expected Expected modal color CSS.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_modal_uses_the_global_styles_page_colors( $theme, $styles, $expected ) {
		$this->assertTrue( wp_get_theme( $theme )->exists(), "$theme must be installed for this row to test anything." );
		switch_theme( $theme );
		add_filter(
			'wp_theme_json_data_user',
			function ( $user ) use ( $styles ) {
				return $user->update_with( array_merge( array( 'version' => 3 ), $styles ) );
			}
		);
		WP_Theme_JSON_Resolver::clean_cached_data();

		$this->assertSame( $expected, Jetpack_Subscribe_Modal::get_global_styles_color_css() );
	}

	/**
	 * @return array
	 */
	public static function provide_sites() {
		return array(
			'block theme style'                        => array(
				'twentytwentyfour',
				array(),
				'.jetpack-subscribe-modal__modal-content { background-image: linear-gradient( var(--wp--preset--color--base), var(--wp--preset--color--base) ); color: var(--wp--preset--color--contrast); }',
			),
			'owner picks a light page on a dark style' => array(
				'twentytwentyfour',
				array(
					'styles' => array(
						'color' => array(
							'background' => '#ffffff',
							'text'       => 'var:preset|color|base',
						),
					),
				),
				'.jetpack-subscribe-modal__modal-content { background-image: linear-gradient( #ffffff, #ffffff ); color: var(--wp--preset--color--base); }',
			),
			'classic theme without theme.json'         => array( 'twentytwentyone', array(), '' ),
		);
	}
}
