<?php
/**
 * Tests for Critical_CSS_Storage class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Class Critical_CSS_Storage_Test
 *
 * @covers \Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage
 */
#[CoversClass( Critical_CSS_Storage::class )]
class Critical_CSS_Storage_Test extends BaseTestCase {

	/**
	 * Test instance.
	 *
	 * @var Critical_CSS_Storage
	 */
	private $instance;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->instance = new Critical_CSS_Storage();
	}

	/**
	 * Test storing and retrieving basic CSS.
	 */
	public function test_store_and_get_basic_css() {
		$key = 'test-provider';
		$css = 'body { color: red; }';

		$this->instance->store_css( $key, $css );

		$result = $this->instance->get_css( array( $key ) );

		$this->assertSame( $key, $result['key'] );
		$this->assertSame( $css, $result['css'] );
	}

	/**
	 * Test storing and retrieving CSS with SVG content.
	 */
	public function test_store_and_get_css_with_svg() {
		$key = 'test-svg-provider';
		$css = ".test-svg-background { background:#fff url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%2328303d'><polygon points='0,0 10,0 5,5' /></svg>\") no-repeat;}";

		$this->instance->store_css( $key, $css );
		$result = $this->instance->get_css( array( $key ) );

		$this->assertSame( $key, $result['key'] );
		$this->assertSame( $css, $result['css'] );
	}

	/**
	 * Test retrieving CSS with multiple provider keys.
	 */
	public function test_get_css_with_multiple_providers() {
		$key1 = 'provider-1';
		$css1 = 'body { margin: 0; }';
		$key2 = 'provider-2';
		$css2 = 'div { padding: 10px; }';

		$this->instance->store_css( $key1, $css1 );
		$this->instance->store_css( $key2, $css2 );

		// First provider should be returned
		$result = $this->instance->get_css( array( $key1, $key2 ) );
		$this->assertSame( $key1, $result['key'] );
		$this->assertSame( $css1, $result['css'] );
	}

	/**
	 * Test retrieving CSS with non-existent provider key.
	 */
	public function test_get_css_with_nonexistent_provider() {
		$result = $this->instance->get_css( array( 'nonexistent-provider' ) );
		$this->assertFalse( $result );
	}

	/**
	 * Test clearing CSS storage.
	 */
	public function test_clear_storage() {
		$key = 'provider-3';
		$css = 'body { color: blue; }';

		$this->instance->store_css( $key, $css );
		$this->instance->clear();

		$result = $this->instance->get_css( array( $key ) );
		$this->assertFalse( $result );
	}

	/**
	 * Test storing and retrieving complex CSS with multiple SVGs.
	 */
	public function test_store_and_get_complex_css_with_svg() {
		$key = 'complex-svg-provider';
		$css = "
			.icon-1 { background: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='40' /></svg>\"); }
			.icon-2 { background: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' /></svg>\"); }
		";

		$this->instance->store_css( $key, $css );
		$result = $this->instance->get_css( array( $key ) );

		$this->assertSame( $key, $result['key'] );
		$this->assertSame( $css, $result['css'] );
	}

	/**
	 * Test storing and retrieving CSS with escaped SVG URL.
	 *
	 * The Critical CSS Generator returns SVG values with slashes, but the CSS is stored without slashes.
	 */
	public function test_store_and_get_css_with_slashed_svg() {
		$key           = 'slashed-svg-provider';
		$css           = ".icon-3 { background: url(data:image/svg+xml;utf8,<svg\ xmlns=\'http://www.w3.org/2000/svg\'\ width=\'10\'\ height=\'10\'\ fill=\'%2328303d\'><polygon\ points=\'0,0\ 10,0\ 5,5\'/></svg>) no-repeat}";
		$css_unslashed = ".icon-3 { background: url(data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%2328303d'><polygon points='0,0 10,0 5,5'/></svg>) no-repeat}";

		$this->instance->store_css( $key, $css );
		$result = $this->instance->get_css( array( $key ) );

		$this->assertSame( $key, $result['key'] );
		$this->assertSame( $css_unslashed, $result['css'] );
	}

	/**
	 * Test storing empty CSS.
	 */
	public function test_store_empty_css() {
		$key = 'empty-provider';
		$css = '';

		$this->instance->store_css( $key, $css );
		$result = $this->instance->get_css( array( $key ) );

		$this->assertFalse( $result );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		parent::tear_down();
		$this->instance->clear();
	}
}
