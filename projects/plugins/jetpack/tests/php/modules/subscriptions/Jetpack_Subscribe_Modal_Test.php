<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';

use PHPUnit\Framework\Attributes\DataProvider;

class Jetpack_Subscribe_Modal_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const BLOCK_THEME_STYLES = array(
		'styles' => array(
			'color' => array(
				'background' => 'var(--wp--preset--color--base)',
				'text'       => 'var(--wp--preset--color--contrast)',
			),
		),
	);

	public function tear_down() {
		remove_all_filters( 'wp_theme_json_data_theme' );
		remove_all_filters( 'wp_theme_json_data_user' );
		WP_Theme_JSON_Resolver::clean_cached_data();
		parent::tear_down();
	}

	/**
	 * Replace the active theme's theme.json.
	 *
	 * @param array $theme Partial theme.json, merged over version 3.
	 */
	private function replace_theme_json( array $theme ) {
		add_filter(
			'wp_theme_json_data_theme',
			function () use ( $theme ) {
				return new WP_Theme_JSON_Data( array_merge( array( 'version' => 3 ), $theme ), 'theme' );
			}
		);
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param array  $theme    The theme's theme.json.
	 * @param array  $styles   The owner's Global Styles, as saved in the site editor.
	 * @param string $expected Expected modal color CSS.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_modal_uses_the_global_styles_page_colors( $theme, $styles, $expected ) {
		$this->replace_theme_json( $theme );
		add_filter(
			'wp_theme_json_data_user',
			function ( $user ) use ( $styles ) {
				return $user->update_with( array_merge( array( 'version' => 3 ), $styles ) );
			}
		);
		WP_Theme_JSON_Resolver::clean_cached_data();

		$this->assertSame( $expected, Jetpack_Subscribe_Modal::get_global_styles_color_css() );
	}

	public function test_modal_keeps_its_colors_when_the_template_is_customized() {
		$this->replace_theme_json( self::BLOCK_THEME_STYLES );
		$template_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_name'    => Jetpack_Subscribe_Modal::BLOCK_TEMPLATE_PART_SLUG,
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:paragraph --><p>Discover <mark style="background-color:rgba(0, 0, 0, 0);color:#000000" class="has-inline-color">more</mark></p><!-- /wp:paragraph -->',
			)
		);
		wp_set_post_terms( $template_id, get_stylesheet(), 'wp_theme' );

		$this->assertSame( '', Jetpack_Subscribe_Modal::get_global_styles_color_css() );
	}

	/**
	 * @return array
	 */
	public static function provide_sites() {
		return array(
			'block theme style'                        => array(
				self::BLOCK_THEME_STYLES,
				array(),
				'.jetpack-subscribe-modal__modal-content { background: linear-gradient( var(--wp--preset--color--base), var(--wp--preset--color--base) ); background-color: var(--jetpack-subscribe-modal--background-color); color: var(--wp--preset--color--contrast); }',
			),
			'owner picks a light page on a dark style' => array(
				self::BLOCK_THEME_STYLES,
				array(
					'styles' => array(
						'color' => array(
							'background' => '#ffffff',
							'text'       => 'var:preset|color|base',
						),
					),
				),
				'.jetpack-subscribe-modal__modal-content { background: linear-gradient( #ffffff, #ffffff ); background-color: var(--jetpack-subscribe-modal--background-color); color: var(--wp--preset--color--base); }',
			),
			'style with a page gradient'               => array(
				self::BLOCK_THEME_STYLES,
				array( 'styles' => array( 'color' => array( 'gradient' => 'var(--wp--preset--gradient--base-secondary-base) no-repeat' ) ) ),
				'.jetpack-subscribe-modal__modal-content { background: var(--wp--preset--gradient--base-secondary-base) no-repeat, linear-gradient( var(--wp--preset--color--base), var(--wp--preset--color--base) ); background-color: var(--jetpack-subscribe-modal--background-color); color: var(--wp--preset--color--contrast); }',
			),
			'owner adds a page background image'       => array(
				self::BLOCK_THEME_STYLES,
				array( 'styles' => array( 'background' => array( 'backgroundImage' => array( 'url' => 'https://example.com/paper.jpg' ) ) ) ),
				'',
			),
			'theme stores the text color as a ref'     => array(
				array(
					'styles' => array(
						'color' => array(
							'background' => '#000000',
							'text'       => array( 'ref' => 'styles.elements.link.color.text' ),
						),
					),
				),
				array(),
				'',
			),
			'stored color tries to close the CSS rule' => array(
				self::BLOCK_THEME_STYLES,
				array( 'styles' => array( 'color' => array( 'background' => '#000000; } body { display: none' ) ) ),
				'',
			),
			'classic theme without theme.json'         => array( array(), array(), '' ),
		);
	}
}
