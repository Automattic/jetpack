<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_CSS;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Styles;

if ( ! defined( 'JETPACK_BOOST_DIR_PATH' ) ) {
	define( 'JETPACK_BOOST_DIR_PATH', dirname( __DIR__, 4 ) );
}
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/loader.php';

if ( ! function_exists( 'jetpack_boost_ds_get' ) ) {
	require_once JETPACK_BOOST_DIR_PATH . '/wp-js-data-sync.php';
}

class Concatenate_CSS_Style_Loader_Tag_Test extends BaseTestCase {

	/**
	 * @var string
	 */
	private $asset_dir;

	public function set_up() {
		parent::set_up();

		// Dependency_Path_Mapping only concatenates files it can resolve under wp-content.
		$this->asset_dir = WP_CONTENT_DIR . '/boost-concat-tag-test-' . getmypid();
		if ( ! is_dir( $this->asset_dir ) ) {
			mkdir( $this->asset_dir, 0755, true );
		}
		file_put_contents( $this->asset_dir . '/widget.css', '.w{color:red}' );
		file_put_contents( $this->asset_dir . '/nav.css', '.n{color:blue}' );
	}

	public function tear_down() {
		remove_all_filters( 'style_loader_tag' );
		foreach ( array( 'widget.css', 'nav.css' ) as $name ) {
			if ( file_exists( $this->asset_dir . '/' . $name ) ) {
				unlink( $this->asset_dir . '/' . $name );
			}
		}
		if ( is_dir( $this->asset_dir ) ) {
			@rmdir( $this->asset_dir ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- best effort cleanup.
		}

		parent::tear_down();
	}

	private function render_styles() {
		$prefix = '/wp-content/' . basename( $this->asset_dir ) . '/';
		$styles = new Concatenate_CSS( new WP_Styles() );
		$styles->add( 'trustindex-widget-css-abc', $prefix . 'widget.css', array(), null );
		$styles->add( 'theme-nav', $prefix . 'nav.css', array(), null );
		$styles->enqueue( array( 'trustindex-widget-css-abc', 'theme-nav' ) );

		ob_start();
		try {
			$styles->do_items();
		} finally {
			$output = ob_get_clean();
		}

		return (string) $output;
	}

	public function test_prefix_matching_preload_filter_only_affects_its_own_stylesheet() {
		// Trustindex 15.0 does this to its widget stylesheet.
		add_filter(
			'style_loader_tag',
			function ( $tag, $handle ) {
				if ( 0 !== strpos( $handle, 'trustindex-widget-css-' ) ) {
					return $tag;
				}
				return preg_replace( '/\srel=(["\'])stylesheet\1/', ' rel="preload" as="style"', $tag, 1 );
			},
			10,
			2
		);

		$output = $this->render_styles();

		$this->assertStringNotContainsString( '??', $output );
		$this->assertMatchesRegularExpression( '/<link[^>]+rel="preload"[^>]+widget\.css/', $output );
		$this->assertMatchesRegularExpression( '/<link[^>]+rel=[\'"]stylesheet[\'"][^>]+nav\.css/', $output );
	}

	/**
	 * @dataProvider provide_filters_that_keep_a_stylesheet_link
	 * @param callable $filter A style_loader_tag callback.
	 */
	#[DataProvider( 'provide_filters_that_keep_a_stylesheet_link' )]
	public function test_filter_that_keeps_a_stylesheet_link_leaves_bundle_concatenated( $filter ) {
		add_filter( 'style_loader_tag', $filter, 10, 4 );

		$output = $this->render_styles();

		$this->assertStringContainsString( '??', $output );
		$this->assertStringNotContainsString( 'nav.css', $output );
	}

	public static function provide_filters_that_keep_a_stylesheet_link() {
		return array(
			'Critical CSS defers it inside a noscript fallback' => array(
				array( new Display_Critical_CSS( 'body{color:red}' ), 'asynchronize_stylesheets' ),
			),
			'a preload hint is printed before it' => array(
				static function ( $tag, $handle, $href ) {
					return "<link rel='preload' as='style' href='$href' />" . $tag;
				},
			),
		);
	}
}
