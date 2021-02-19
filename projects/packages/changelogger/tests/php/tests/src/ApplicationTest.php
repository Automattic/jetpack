<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for the changelogger Application class.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger\Tests;

use Automattic\Jetpack\Changelogger\Application;
use Automattic\Jetpack\Changelogger\Config;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\ApplicationTester;
use Wikimedia\TestingAccessWrapper;

/**
 * Tests for the changelogger Application class.
 *
 * @covers \Automattic\Jetpack\Changelogger\Application
 */
class ApplicationTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertionRenames;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	/**
	 * Test the application.
	 */
	public function testBasics() {
		$app = new Application();

		$this->assertSame( 'Jetpack Changelogger', $app->getName() );
		$this->assertSame( Application::VERSION, $app->getVersion() );

		$app->setAutoExit( false );
		$tester = new ApplicationTester( $app );
		$tester->run( array( 'command' => 'list' ) );
		$output = $tester->getDisplay();
		$this->assertMatchesRegularExpression( '/Available commands:/', $output );
		$this->assertMatchesRegularExpression( '/add\s*Adds a change file/', $output );
	}

	/**
	 * Test the stuff done by doRun().
	 */
	public function testDoRun() {
		$app = new Application();
		$app->setAutoExit( false );

		$mock = $this->getMockBuilder( Command::class )
			->setConstructorArgs( array( 'testDoRun' ) )
			->setMethods( array( 'execute' ) )
			->getMock();
		$mock->expects( $this->once() )->method( 'execute' )->willReturnCallback(
			function ( $input, $output ) {
				$this->assertSame( $output, TestingAccessWrapper::newFromClass( Config::class )->out );
				$this->assertTrue( $output->getFormatter()->hasStyle( 'warning' ) );
				return 42;
			}
		);
		$app->add( $mock );

		$tester = new ApplicationTester( $app );
		$code   = $tester->run( array( 'command' => 'testDoRun' ), array( 'decorated' ) );
		$this->assertSame( 42, $code );
	}

}
