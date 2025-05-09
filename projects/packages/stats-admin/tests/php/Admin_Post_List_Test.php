<?php
use Automattic\Jetpack\Stats_Admin\Admin_Post_List_Column;
use Automattic\Jetpack\Stats_Admin\TestCase as BaseTestCase;
use PHPUnit\Framework\Attributes\DataProvider;

class Admin_Post_List_Test extends BaseTestCase {
	public function test_register_creates_instance() {
		// Ensure the register method creates an instance of the class
		$instance = Admin_Post_List_Column::register();
		$this->assertInstanceOf( Admin_Post_List_Column::class, $instance );
	}

	public function test_add_stats_post_table_adds_stats_column() {
		// Prepare a simple columns array
		$columns = array(
			'title' => 'Title',
			'date'  => 'Date',
		);

		wp_set_current_user( $this->admin_id );

		$set_cap = function ( $caps ) {
			$caps['view_stats'] = true;

			return $caps;
		};

		add_filter( 'user_has_cap', $set_cap );
		// Call the method to add the stats column
		$columns_with_stats = Admin_Post_List_Column::register()->add_stats_post_table( $columns );
		remove_filter( 'user_has_cap', $set_cap );

		// Assert that the 'stats' column is added
		$this->assertArrayHasKey( 'stats', $columns_with_stats );
		$this->assertEquals( 'Stats', $columns_with_stats['stats'] );
	}

	/**
	 * Test if doesn't add the stats column if they don't have the right to view stats.
	 *
	 * @return void
	 */
	public function test_add_stats_post_table_not_adds_stats_column() {
		// Prepare a simple columns array
		$columns = array(
			'title' => 'Title',
			'date'  => 'Date',
		);

		wp_set_current_user( $this->admin_id );

		$set_cap = function ( $caps ) {
			unset( $caps['view_stats'] );
			unset( $caps['manage_options'] );

			return $caps;
		};

		add_filter( 'user_has_cap', $set_cap );
		// Call the method to add the stats column
		$columns_with_stats = Admin_Post_List_Column::register()->add_stats_post_table( $columns );
		remove_filter( 'user_has_cap', $set_cap );

		// Assert that the 'stats' column is not added
		$this->assertArrayNotHasKey( 'stats', $columns_with_stats );
	}

	/**
	 * Test the post table with a published post.
	 *
	 * @return void
	 */
	public function test_add_stats_post_table_cell_with_published_post() {
		// Insert a new post with 'publish' status
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Published Test Post',
				'post_content' => 'This is a published test post.',
				'post_status'  => 'publish', // Set the post status to 'publish'
				'post_author'  => 1, // Set the post author (e.g., admin user)
			)
		);

		// Ensure the post was created and published
		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );
		$this->assertEquals( 'publish', get_post_status( $post_id ) );

		// Mock the global $wp_query to simulate a post list query
		global $wp_query;
		$wp_query = (object) array(
			'posts' => array( (object) array( 'ID' => $post_id ) ), // Simulate the post in the query
		);

		// Create a mock for the protected `get_stats` method
		$mocked_stats = $this->getMockBuilder( Automattic\Jetpack\Stats\WPCOM_Stats::class )
							->onlyMethods( array( 'get_total_post_views' ) ) // Mock the get_stats method
							->getMock();

		// Define behavior for the mocked `get_stats` method
		$mocked_stats->method( 'get_total_post_views' )->willReturn(
			array(
				'posts' => array(
					array(
						'ID'    => $post_id,
						'views' => 1200000,
					),
				),
			)
		);

		$column_mock = $this->getMockBuilder( Admin_Post_List_Column::class )
							->onlyMethods( array( 'get_stats' ) ) // Mock the get_stats method
							->getMock();

		// Replace the actual get_stats method with our mocked version
		$column_mock->method( 'get_stats' )->willReturn( $mocked_stats );

		// Start output buffering
		ob_start();
		$column_mock->add_stats_post_table_cell( 'stats', $post_id );
		$output = ob_get_clean();

		// Assert that the stats link is present in the output
		$this->assertStringContainsString( 'admin.php?page=stats#!/stats/post/' . $post_id, $output );

		$this->assertStringContainsString( '1.2M', $output );

		// Clean up by deleting the post
		wp_delete_post( $post_id, true ); // true ensures the post is permanently deleted

		// Reset $wp_query after test
		$wp_query = null;
	}

	/**
	 * @return void
	 */
	public function test_add_stats_post_table_cell_with_no_stats() {
		// Insert a new post with 'draft' status
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'This is a test post.',
				'post_status'  => 'draft', // Set the post status to 'draft'
				'post_author'  => 1, // Set the post author (e.g., admin user)
			)
		);

		// Ensure the post was created
		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );

		// Set the column name
		$column = 'stats';

		global $wp_query;
		$wp_query = (object) array(
			'posts' => array( (object) array( 'ID' => $post_id ) ), // Simulate the post in the query
		);

		// Create an instance of the Admin_Post_List_Column class
		$column_instance = Admin_Post_List_Column::register();

		// Start output buffering
		ob_start();
		$column_instance->add_stats_post_table_cell( $column, $post_id );
		$output = ob_get_clean();

		// Assert that "No stats" is displayed when the post is not published (it's in 'draft' status)
		$this->assertStringContainsString( 'No stats', $output );

		// Clean up by deleting the post
		wp_delete_post( $post_id, true );
		$wp_query = null;
	}

	/**
	 * Test the CSS output.
	 *
	 * @return void
	 */
	public function test_stats_load_admin_css() {
		// Capture output from the `stats_load_admin_css` method
		ob_start();
		Admin_Post_List_Column::register()->stats_load_admin_css();
		$output = ob_get_clean();

		// Ensure the correct CSS is outputted for the Stats column width
		$this->assertStringContainsString( '.fixed .column-stats', $output );
	}

	/**
	 * Test the get_post_page_views_for_current_list.
	 *
	 * @return void
	 */
	public function test_get_post_page_views_for_current_list() {
		global $wp_query;

		// Mock wp_query to simulate posts
		$wp_query = (object) array(
			'posts' => array( (object) array( 'ID' => 123 ) ),
		);

		// Mock get_stats() method to return fake views
		$mock_stats = $this->createMock( Automattic\Jetpack\Stats\WPCOM_Stats::class );
		$mock_stats->method( 'get_total_post_views' )->willReturn(
			array(
				'posts' => array(
					array(
						'ID'    => 123,
						'views' => 100,
					),
				),
			)
		);

		// Override the method to return the mocked stats
		$column = $this->getMockBuilder( Admin_Post_List_Column::class )
						->onlyMethods( array( 'get_stats' ) )
						->getMock();
		$column->method( 'get_stats' )->willReturn( $mock_stats );

		// Call the method under test
		$views = $column->get_post_page_views_for_current_list();

		// Assert that the result is an array and contains the correct views
		$this->assertIsArray( $views );
		$this->assertArrayHasKey( 123, $views );
		$this->assertEquals( 100, $views[123] ); // Ensure it has the correct view count
	}

	/**
	 * Test the fallback format to compact.
	 *
	 * @return void
	 */
	public function test_get_fallback_format_to_compact_version() {
		$instance = new Admin_Post_List_Column();

		$this->assertSame( '0', $instance->get_fallback_format_to_compact_version( 0 ) );
		$this->assertEquals( '10M', $instance->get_fallback_format_to_compact_version( 10000000 ) );
		$this->assertEquals( '1M', $instance->get_fallback_format_to_compact_version( 1000000 ) );
		$this->assertEquals( '1.5M', $instance->get_fallback_format_to_compact_version( 1500000 ) );
		$this->assertEquals( '10K', $instance->get_fallback_format_to_compact_version( 10000 ) );
		$this->assertEquals( '1K', $instance->get_fallback_format_to_compact_version( 1000 ) );
		$this->assertEquals( '1.2K', $instance->get_fallback_format_to_compact_version( 1200 ) );
		$this->assertSame( '999', $instance->get_fallback_format_to_compact_version( 999 ) );
	}

	/**
	 * Test the locale validation and caching.
	 *
	 * @dataProvider locale_provider
	 *
	 * @param string $input  The input locale.
	 * @param string $output The expected output locale.
	 *
	 * @return void
	 */
	#[DataProvider( 'locale_provider' )]
	public function test_get_validated_locale( $input, $output ) {
		$instance = new Admin_Post_List_Column();

		// Test first call
		$this->assertEquals( $output, $instance->get_validated_locale( $input ) );

		// Test caching behavior
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- This is done on purpose to ensure the second call will return the cached value.
		$this->assertEquals( $output, $instance->get_validated_locale( $input ) );
	}

	/**
	 * Data provider for test_get_validated_locale.
	 *
	 * @return array
	 */
	public static function locale_provider() {
		return array(
			'valid locale en_US'            => array(
				'input'  => 'en_US',
				'output' => 'en_US',
			),
			'invalid locale skr'            => array(
				'input'  => 'skr',
				'output' => 'en_US',
			),
			'invalid locale invalid_locale' => array(
				'input'  => 'invalid_locale',
				'output' => 'en_US',
			),
			'valid locale fr_FR'            => array(
				'input'  => 'fr_FR',
				'output' => 'fr_FR',
			),
		);
	}
}
