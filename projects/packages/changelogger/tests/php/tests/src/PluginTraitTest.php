<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger PluginTrait..
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\PluginTrait;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;
use Wikimedia\TestingAccessWrapper;

/**
 * Tests for the changelogger PluginTrait..
 *
 * @covers \Automattic\Jetpack\Changelogger\PluginTrait
 */
class PluginTraitTest extends TestCase {

	/**
	 * Test the trait.
	 */
	public function testTrait() {
		$mock = $this->getMockBuilder( PluginTrait::class )->getMockForTrait();
		$w    = TestingAccessWrapper::newFromObject( $mock );

		$this->assertSame( array(), $mock->getOptions() );

		$this->assertNull( $w->input );
		$this->assertNull( $w->output );
		$input  = new ArrayInput( array() );
		$output = new NullOutput();
		$mock->setIO( $input, $output );
		$this->assertSame( $input, $w->input );
		$this->assertSame( $output, $w->output );

		$class = get_class( $mock );
		$this->assertInstanceOf( $class, call_user_func( array( $class, 'instantiate' ), array() ) );
	}

}
