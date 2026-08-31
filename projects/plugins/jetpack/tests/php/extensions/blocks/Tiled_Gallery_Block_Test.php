<?php
/**
 * Tiled Gallery Block tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/tiled-gallery/tiled-gallery.php';

use Automattic\Jetpack\Extensions\Tiled_Gallery;
use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * Tiled Gallery Block tests.
 *
 * The block saves its markup from JavaScript; these tests cover the server side
 * pass that rewrites the saved <img> tags on the front end.
 *
 * @covers Automattic\Jetpack\Extensions\Tiled_Gallery::render
 */
#[CoversMethod( Automattic\Jetpack\Extensions\Tiled_Gallery::class, 'render' )]
class Tiled_Gallery_Block_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const UPLOADS = 'http://example.org/wp-content/uploads/2026/07/';

	/**
	 * Saved markup for a single image gallery.
	 *
	 * @param string $file   File name the img src points at.
	 * @param int    $width  Value of the img's data-width, the width of the original upload.
	 * @param int    $height Value of the img's data-height, the height of the original upload.
	 * @return string The gallery markup as the block's save function writes it.
	 */
	private function gallery_markup( $file, $width, $height ) {
		return '<div class="wp-block-jetpack-tiled-gallery is-style-rectangular">'
			. '<div class="tiled-gallery__gallery">'
			. '<div class="tiled-gallery__row">'
			. '<div class="tiled-gallery__col" style="flex-basis:100%">'
			. '<figure class="tiled-gallery__item">'
			. '<img alt="" data-height="' . $height . '" data-id="1"'
			. ' data-url="' . self::UPLOADS . $file . '" data-width="' . $width . '"'
			. ' src="' . self::UPLOADS . $file . '"/>'
			. '</figure></div></div></div></div>';
	}

	/**
	 * Widths advertised by the first srcset in a chunk of markup.
	 *
	 * @param string $markup Rendered block markup.
	 * @return array Width descriptors found in the srcset, as integers.
	 */
	private function srcset_widths( $markup ) {
		if ( ! preg_match( '/srcset="([^"]*)"/', $markup, $srcset ) ) {
			return array();
		}

		// Match the width descriptors directly rather than splitting on the comma
		// separator: the candidate URLs are escaped, and a squareish layout puts a
		// comma inside them via the resize argument. URLs never contain a space,
		// so a space followed by digits and a "w" is unambiguously a descriptor.
		preg_match_all( '/\s(\d+)w/', $srcset[1], $widths );
		return array_map( 'intval', $widths[1] );
	}

	/**
	 * Pretend the Carousel module is active, which is what makes the block add the
	 * role, tabindex and aria-label attributes that open an image full screen.
	 */
	private function activate_carousel() {
		add_filter(
			'jetpack_active_modules',
			function ( $modules ) {
				$modules[] = 'carousel';
				return $modules;
			}
		);
	}

	/**
	 * The srcset must not be glued to the attribute before it.
	 *
	 * With Carousel active the block prefixes the img with an aria-label and then
	 * appends the srcset, and the two ran together as aria-label="…"srcset="…".
	 * See JETPACK-1990.
	 */
	public function test_render_separates_srcset_from_the_preceding_attribute() {
		$this->activate_carousel();

		$rendered = Tiled_Gallery::render(
			array( 'className' => 'is-style-rectangular' ),
			$this->gallery_markup( 'photo.jpg', 2048, 1365 )
		);

		$this->assertStringContainsString( 'aria-label=', $rendered );
		$this->assertStringNotContainsString( '"srcset=', $rendered );
	}

	/**
	 * The srcset must not advertise widths the file it points at cannot produce.
	 *
	 * The candidates are sized from the original upload's data-width, but they are
	 * built on the img's src, which is usually an intermediate size. Photon never
	 * upscales, so a candidate wider than that file serves a narrower image than
	 * the browser was told to expect. See JETPACK-1990.
	 */
	public function test_render_caps_srcset_widths_at_the_width_of_the_source_file() {
		$rendered = Tiled_Gallery::render(
			array( 'className' => 'is-style-rectangular' ),
			$this->gallery_markup( 'photo-1024x683.jpg', 2048, 1365 )
		);

		$widths = $this->srcset_widths( $rendered );

		$this->assertNotEmpty( $widths );
		$this->assertLessThanOrEqual( 1024, max( $widths ) );
	}

	/**
	 * An src with no intermediate size suffix still gets the full range of candidates.
	 */
	public function test_render_sizes_srcset_from_the_original_when_src_has_no_size_suffix() {
		$rendered = Tiled_Gallery::render(
			array( 'className' => 'is-style-rectangular' ),
			$this->gallery_markup( 'photo.jpg', 2048, 1365 )
		);

		$this->assertSame( 2000, max( $this->srcset_widths( $rendered ) ) );
	}
}
