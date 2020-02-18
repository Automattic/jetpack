<?php // phpcs:ignore WordPress.Files.FileName

namespace Automattic\Jetpack\Config;

use Automattic\Jetpack\Config\Textdomain_Customizer;
use phpmock\Mock;
use phpmock\MockBuilder;
use phpmock\spy\Spy;
use PHPUnit\Framework\TestCase;

/**
 * Contains unit tests for the Textdomain_Customizer class.
 */
class Test_Textdomain_Customizer extends TestCase {

	/**
	 * Setup function.
	 */
	public function setUp() {

		$this->textdomain_customizer = $this->getMockBuilder( 'Automattic\Jetpack\Config\Textdomain_Customizer' )
			->disableOriginalConstructor()
			->setMethods( array( 'get_packages', 'set_vendor_dir', 'get_root_extra' ) )
			->getMock();

		$this->textdomain_customizer->expects( $this->once() )
			->method( 'set_vendor_dir' )
			->will( $this->returnValue( '' ) );

		$this->mock_function( 'is_dir', false );
		$this->mock_function( 'is_file', true );
		$this->mock_function( 'realpath', true );
	}

	/**
	 * Teardown function.
	 */
	public function tearDown() {
		unset( $this->textdomain_customizer );
		Mock::disableAll();
	}

	/**
	 * Test customize_textdomain_in_packages.
	 */
	public function test_customizer_textdomain_in_packages() {

		$input  = "__( 'text to be translated', JETPACK_CUSTOMIZE_TEXTDOMAIN )";
		$output = "__( 'text to be translated', 'test_textdomain' )";

		$this->mock_function( 'file_get_contents', $input );

		$file_put_contents_spy = new Spy(
			__NAMESPACE__,
			'file_put_contents',
			function() {
				return true;
			}
		);
		$file_put_contents_spy->enable();

		$test_package1 = new Mock_Package(
			'automattic/jetpack-test_package1',
			array( 'translatable' => 'test1' )
		);

		$packages = array( $test_package1 );

		$this->textdomain_customizer->expects( $this->once() )
			->method( 'get_packages' )
			->will( $this->returnValue( $packages ) );

		$this->textdomain_customizer->expects( $this->once() )
			->method( 'get_root_extra' )
			->will( $this->returnValue( array( 'textdomain' => 'test_textdomain' ) ) );

		$this->textdomain_customizer->customize_textdomain_in_packages();

		$file_put_contents_invocs = $file_put_contents_spy->getInvocations();
		$this->assertCount( 1, $file_put_contents_invocs );

		$file_put_contents_args = $file_put_contents_invocs[0]->getArguments();
		$this->assertEquals( $output, $file_put_contents_args[1] );
	}

	/**
	 * Mock a global function and make it return a certain value.
	 *
	 * @param string $function_name Name of the function.
	 * @param mixed  $return_value  Return value of the function.
	 * @return phpmock\Mock The mock object.
	 */
	protected function mock_function( $function_name, $return_value = null ) {
		$builder = new MockBuilder();
		$builder->setNamespace( __NAMESPACE__ )
			->setName( $function_name )
			->setFunction(
				function() use ( &$return_value ) {
					return $return_value;
				}
			);
		$mock_function = $builder->build();
		$mock_function->enable();
		return $mock_function;
	}
}

//phpcs:disable Generic.Files.OneObjectStructurePerFile
/**
 *
 * A class to create minimal mock Composers\Package objects for the unit tests.
 * The class provides implementations for the getName() and getExtra() methods.
 */
class Mock_Package {
	/**
	 * The constructor.
	 *
	 * @param string $name The package name.
	 * @param mixed  $extra The package extra.
	 */
	public function __construct( $name, $extra ) {
		$this->name  = $name;
		$this->extra = $extra;
	}

	//phpcs:disable WordPress.NamingConventions
	/**
	 * Returns the mock package's name.
	 */
	public function getName() {
		return $this->name;
	}

	/**
	 * Returns the mock package's extra value.
	 */
	public function getExtra() {
		return $this->extra;
	}

}
