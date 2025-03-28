<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Cornerstone;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Pages;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Tests\Lib\Mocks\Mock_Premium_Features;
use Brain\Monkey\Functions;
use Mockery;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class Cornerstone_Pages_Test extends TestCase {
	private $cornerstone_pages;

	public function setUp(): void {
		parent::setUp();

		// Set up Brain Monkey
		\Brain\Monkey\setUp();

		// Load the mock Premium_Features class
		require_once __DIR__ . '/../mocks/Mock_Premium_Features.php';
		$this->cornerstone_pages = new Cornerstone_Pages();
	}

	public function tearDown(): void {
		Mockery::close();
		\Brain\Monkey\tearDown();
		parent::tearDown();
	}

	public function test_setup_registers_hooks() {
		// Mock WordPress functions
		Functions\expect( 'jetpack_boost_register_option' )->once();
		Functions\expect( 'jetpack_boost_register_readonly_option' )->once();

		// Run setup
		$this->cornerstone_pages->setup();

		// Verify filters and actions were added
		$this->assertEquals( 10, has_filter( 'jetpack_boost_critical_css_providers', array( $this->cornerstone_pages, 'remove_ccss_front_page_provider' ) ) );
		$this->assertEquals( 10, has_filter( 'display_post_states', array( $this->cornerstone_pages, 'add_display_post_states' ) ) );
		$this->assertSame( 0, has_action( 'init', array( $this->cornerstone_pages, 'set_default_pages' ) ) );
	}

	public function test_remove_ccss_front_page_provider() {
		$providers = array(
			array( 'key' => 'core_front_page' ),
			array( 'key' => 'other_provider' ),
		);

		$filtered = $this->cornerstone_pages->remove_ccss_front_page_provider( $providers );

		$this->assertCount( 1, $filtered );
		$this->assertEquals( 'other_provider', $filtered[0]['key'] );
	}

	public function test_get_properties_free_tier() {
		Mock_Premium_Features::set_mock_return( false );

		Functions\when( 'home_url' )
			->justReturn( 'https://example.com' );

		Functions\when( 'jetpack_boost_ds_get' )
			->justReturn( array() );

		// Mock WooCommerce function
		Functions\when( 'wc_get_page_id' )->justReturn( false );

		// Mock get_posts for Yoast cornerstone pages
		Functions\when( 'get_posts' )->justReturn( array() );

		$properties = $this->cornerstone_pages->get_properties();

		$this->assertSame( 1, $properties['max_pages'] );
		$this->assertEquals( 10, $properties['max_pages_premium'] );
		$this->assertIsArray( $properties['default_pages'] );
	}

	public function test_get_properties_premium_tier() {
		Mock_Premium_Features::set_mock_return( true );

		// Mock jetpack_boost_ds_get to return features array
		Functions\when( 'jetpack_boost_ds_get' )
			->justReturn(
				array(
					'features' => array(
						'cornerstone_ten_pages' => true,
					),
				)
			);

		// Mock other required functions
		Functions\when( 'home_url' )
			->justReturn( 'https://example.com' );

		Functions\when( 'wc_get_page_id' )
			->justReturn( false );

		Functions\when( 'get_posts' )
			->justReturn( array() );

		// Create a new instance after setting up all mocks
		$this->cornerstone_pages = new Cornerstone_Pages();

		// Get properties
		$properties = $this->cornerstone_pages->get_properties();

		$this->assertEquals( 10, $properties['max_pages'], 'Premium tier should have 10 max pages' );
		$this->assertEquals( 10, $properties['max_pages_premium'] );
		$this->assertIsArray( $properties['default_pages'] );
		$this->assertContains( 'https://example.com', $properties['default_pages'] );
	}

	public function test_add_display_post_states() {
		// Mock Cornerstone_Utils static method
		$cornerstone_utils = Mockery::mock( 'alias:' . Cornerstone_Utils::class );
		$cornerstone_utils->shouldReceive( 'is_cornerstone_page' )
			->with( 1 )
			->once()
			->andReturn( true );

		Functions\expect( '__' )
			->once()
			->with( 'Cornerstone Page', 'jetpack-boost' )
			->andReturn( 'Cornerstone Page' );

		$post        = (object) array( 'ID' => 1 );
		$post_states = array();

		// Add a post. The is_cornerstone_page method and "__" function will run once.
		$updated_states = $this->cornerstone_pages->add_display_post_states( $post_states, $post );

		$this->assertContains( 'Cornerstone Page', $updated_states );
	}
}
