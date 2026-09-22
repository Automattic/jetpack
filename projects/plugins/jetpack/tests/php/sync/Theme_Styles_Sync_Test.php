<?php
/**
 * Tests for the theme_styles sync callable.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Theme_Styles_Sync;

class Theme_Styles_Sync_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function set_up() {
		parent::set_up();
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	public function tear_down() {
		remove_all_filters( 'wp_theme_json_data_theme' );
		WP_Theme_JSON_Resolver::clean_cached_data();
		parent::tear_down();
	}

	/**
	 * Install a synthetic theme.json for the active theme.
	 *
	 * @param array $data Partial theme.json, merged over version 3.
	 */
	private function with_theme_json( array $data ) {
		add_filter(
			'wp_theme_json_data_theme',
			function ( $theme_json ) use ( $data ) {
				return $theme_json->update_with( array_merge( array( 'version' => 3 ), $data ) );
			}
		);
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	/**
	 * Replace the active theme's data outright, rather than merging over it as with_theme_json() does.
	 *
	 * @param array $data Partial theme.json, merged over version 3.
	 */
	private function replacing_theme_json( array $data ) {
		add_filter(
			'wp_theme_json_data_theme',
			function () use ( $data ) {
				return new WP_Theme_JSON_Data( array_merge( array( 'version' => 3 ), $data ), 'theme' );
			}
		);
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	/**
	 * The synced slice, failing the test rather than the array access when nothing resolves.
	 *
	 * @return array
	 */
	private function slice() {
		$slice = Theme_Styles_Sync::get_theme_styles();
		$this->assertIsArray( $slice );

		return $slice;
	}

	public function test_reports_the_active_stylesheet() {
		$this->with_theme_json( array( 'styles' => array( 'color' => array( 'text' => '#111111' ) ) ) );

		$this->assertSame( get_stylesheet(), $this->slice()['stylesheet'] );
	}

	public function test_keeps_allowlisted_styles() {
		$this->with_theme_json(
			array(
				'styles' => array(
					'color'    => array( 'text' => '#111111' ),
					'spacing'  => array( 'blockGap' => '1.5rem' ),
					'elements' => array(
						'link' => array( 'color' => array( 'text' => '#0000ff' ) ),
					),
				),
			)
		);

		$styles = $this->slice()['styles'];

		$this->assertSame( '#111111', $styles['color']['text'] );
		$this->assertSame( '1.5rem', $styles['spacing']['blockGap'] );
		$this->assertSame( '#0000ff', $styles['elements']['link']['color']['text'] );
	}

	public function test_drops_styles_outside_the_allowlist() {
		$this->with_theme_json(
			array(
				'styles' => array(
					'color'  => array( 'text' => '#111111' ),
					'blocks' => array(
						'core/paragraph' => array( 'color' => array( 'text' => '#222222' ) ),
					),
				),
			)
		);

		$styles = $this->slice()['styles'];

		$this->assertArrayNotHasKey( 'blocks', $styles );
		$this->assertSame( '#111111', $styles['color']['text'] );
	}

	public function test_resolves_preset_variables_to_literals() {
		$this->with_theme_json(
			array(
				'settings' => array(
					'color'      => array(
						'palette' => array(
							array(
								'slug'  => 'primary',
								'color' => '#abcdef',
								'name'  => 'Primary',
							),
						),
					),
					'typography' => array(
						'fontSizes' => array(
							array(
								'slug' => 'huge',
								'size' => '42px',
								'name' => 'Huge',
							),
						),
					),
				),
				'styles'   => array(
					'color'      => array( 'text' => 'var(--wp--preset--color--primary)' ),
					'typography' => array( 'fontSize' => 'var(--wp--preset--font-size--huge)' ),
				),
			)
		);

		$styles = $this->slice()['styles'];

		$this->assertSame( '#abcdef', $styles['color']['text'] );
		$this->assertSame( '42px', $styles['typography']['fontSize'] );
	}

	/**
	 * Core's palette is merged in only to resolve core-defined presets, and must not ride along
	 * as though the theme had declared it -- wpcom's merge_palettes() would treat it as the
	 * site's own colors.
	 */
	public function test_palette_carries_the_theme_colors_only() {
		$this->with_theme_json(
			array(
				'settings' => array(
					'color' => array(
						'palette' => array(
							array(
								'slug'  => 'primary',
								'color' => '#abcdef',
								'name'  => 'Primary',
							),
						),
					),
				),
			)
		);

		$palette = $this->slice()['settings']['color']['palette'];

		$this->assertSame( array( 'primary' ), wp_list_pluck( $palette, 'slug' ) );
	}

	public function test_resolves_presets_core_defines() {
		$this->with_theme_json(
			array(
				'styles' => array( 'color' => array( 'text' => 'var(--wp--preset--color--black)' ) ),
			)
		);

		$text = $this->slice()['styles']['color']['text'];

		$this->assertStringStartsNotWith( 'var(', $text );
	}

	/**
	 * Core is merged in only so its presets can be resolved against; its own default styles must
	 * not sync as though the site had chosen them.
	 */
	public function test_styles_carry_the_theme_declarations_only() {
		$this->replacing_theme_json( array( 'styles' => array( 'color' => array( 'text' => '#111111' ) ) ) );

		$styles = $this->slice()['styles'];

		$this->assertSame( array( 'color' ), array_keys( $styles ) );
		$this->assertSame( array( 'text' ), array_keys( $styles['color'] ) );
	}

	/**
	 * Sync skips a null value, so reporting nothing would leave the receiving end holding the
	 * previous theme's design with nothing to say the theme had changed.
	 */
	public function test_still_reports_a_theme_that_declares_nothing_inheritable() {
		$this->replacing_theme_json( array() );

		$slice = $this->slice();

		$this->assertSame( get_stylesheet(), $slice['stylesheet'] );
		$this->assertSame( array(), $slice['styles'] );
		$this->assertSame( array(), $slice['settings']['color']['palette'] );
	}

	/**
	 * Core's schema leaves `settings.color.palette` untouched when it is not an array, and the
	 * WP_Theme_JSON constructor origin-keys it anyway -- so a scalar reaches the flattening.
	 */
	public function test_survives_a_palette_that_is_not_an_array() {
		$this->replacing_theme_json( array( 'settings' => array( 'color' => array( 'palette' => 'oops' ) ) ) );

		$this->assertSame( array(), $this->slice()['settings']['color']['palette'] );
	}

	public function test_refuses_a_payload_over_the_size_cap() {
		$palette = array();
		for ( $i = 0; $i < 5000; $i++ ) {
			$palette[] = array(
				'slug'  => 'color-' . $i,
				'color' => '#abcdef',
				'name'  => 'Color ' . $i,
			);
		}
		$this->with_theme_json( array( 'settings' => array( 'color' => array( 'palette' => $palette ) ) ) );

		$this->assertNull( Theme_Styles_Sync::get_theme_styles() );
	}

	public function test_registered_as_a_sync_callable() {
		$callables = apply_filters( 'jetpack_sync_callable_whitelist', array() );

		$this->assertArrayHasKey( 'theme_styles', $callables );
		$this->assertTrue( is_callable( $callables['theme_styles'] ) );
	}
}
