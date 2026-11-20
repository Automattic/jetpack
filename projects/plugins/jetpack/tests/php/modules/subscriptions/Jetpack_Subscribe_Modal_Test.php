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

	const BASE_BACKGROUND_CSS = '.jetpack-subscribe-modal__modal-content { --jetpack-subscribe-modal--page-background: var(--wp--preset--color--base); }';

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
	 * Save the owner's Global Styles, as the site editor does.
	 *
	 * @param array $styles Partial theme.json, merged over version 3.
	 */
	private function set_user_styles( array $styles ) {
		add_filter(
			'wp_theme_json_data_user',
			function ( $user ) use ( $styles ) {
				return $user->update_with( array_merge( array( 'version' => 3 ), $styles ) );
			}
		);
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param array  $theme    The theme's theme.json.
	 * @param array  $styles   The owner's Global Styles, as saved in the site editor.
	 * @param string $expected Expected modal background CSS.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_modal_uses_the_global_styles_page_background( $theme, $styles, $expected ) {
		$this->replace_theme_json( $theme );
		$this->set_user_styles( $styles );

		$this->assertSame( $expected, Jetpack_Subscribe_Modal::get_global_styles_background_css() );
	}

	public function test_modal_uses_the_page_background_gradient() {
		if ( version_compare( get_bloginfo( 'version' ), '7.1-alpha', '<' ) ) {
			$this->markTestSkipped( 'styles.background.gradient needs WordPress 7.1.' );
		}
		$this->replace_theme_json( self::BLOCK_THEME_STYLES );
		$this->set_user_styles( array( 'styles' => array( 'background' => array( 'gradient' => 'linear-gradient(135deg,#000,#333)' ) ) ) );

		$this->assertSame(
			'.jetpack-subscribe-modal__modal-content { --jetpack-subscribe-modal--page-background: var(--wp--preset--color--base); background-image: linear-gradient(135deg,#000,#333); }',
			Jetpack_Subscribe_Modal::get_global_styles_background_css()
		);
	}

	/**
	 * @dataProvider provide_saved_templates
	 *
	 * @param string $content  The saved template part's content.
	 * @param string $expected Expected modal background CSS.
	 */
	#[DataProvider( 'provide_saved_templates' )]
	public function test_modal_keeps_its_background_when_a_saved_template_sets_colors( $content, $expected ) {
		$this->replace_theme_json( self::BLOCK_THEME_STYLES );
		$template_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_name'    => Jetpack_Subscribe_Modal::BLOCK_TEMPLATE_PART_SLUG,
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);
		wp_set_post_terms( $template_id, get_stylesheet(), 'wp_theme' );

		$this->assertSame( $expected, Jetpack_Subscribe_Modal::get_global_styles_background_css() );
	}

	/**
	 * @return array
	 */
	public static function provide_sites() {
		return array(
			'block theme style'                     => array( self::BLOCK_THEME_STYLES, array(), self::BASE_BACKGROUND_CSS ),
			'owner picks a page color in Styles'    => array(
				self::BLOCK_THEME_STYLES,
				array( 'styles' => array( 'color' => array( 'background' => '#ffffff' ) ) ),
				'.jetpack-subscribe-modal__modal-content { --jetpack-subscribe-modal--page-background: #ffffff; }',
			),
			'style with a page gradient'            => array(
				self::BLOCK_THEME_STYLES,
				array( 'styles' => array( 'color' => array( 'gradient' => 'var(--wp--preset--gradient--base-secondary-base) no-repeat' ) ) ),
				'.jetpack-subscribe-modal__modal-content { --jetpack-subscribe-modal--page-background: var(--wp--preset--color--base); background: var(--wp--preset--gradient--base-secondary-base) no-repeat; background-color: var(--jetpack-subscribe-modal--page-background, #fefefe); }',
			),
			'owner adds a page background image'    => array(
				self::BLOCK_THEME_STYLES,
				array( 'styles' => array( 'background' => array( 'backgroundImage' => array( 'url' => 'https://example.com/paper.jpg' ) ) ) ),
				'',
			),
			'owner removes the theme\'s page image' => array(
				array_merge_recursive( self::BLOCK_THEME_STYLES, array( 'styles' => array( 'background' => array( 'backgroundImage' => array( 'url' => 'https://example.com/paper.jpg' ) ) ) ) ),
				array( 'styles' => array( 'background' => array( 'backgroundImage' => 'none' ) ) ),
				self::BASE_BACKGROUND_CSS,
			),
			'stored color tries to close the rule'  => array(
				self::BLOCK_THEME_STYLES,
				array( 'styles' => array( 'color' => array( 'background' => '#000000; } body { display: none' ) ) ),
				'',
			),
			'classic theme without theme.json'      => array( array(), array(), '' ),
		);
	}

	/**
	 * @return array
	 */
	public static function provide_saved_templates() {
		return array(
			'owner only changes the wording' => array(
				'<!-- wp:paragraph --><p>Get my latest posts by email.</p><!-- /wp:paragraph -->',
				self::BASE_BACKGROUND_CSS,
			),
			'owner colors part of the text'  => array(
				'<!-- wp:paragraph --><p>Discover <mark style="background-color:rgba(0, 0, 0, 0);color:#000000" class="has-inline-color">more</mark></p><!-- /wp:paragraph -->',
				'',
			),
		);
	}
}
