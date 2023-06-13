<?php

use Automattic\Jetpack\Sync\Replicastore;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once ABSPATH . 'wp-content/mu-plugins/jetpack/sync/class.jetpack-sync-test-object-factory.php';
} else {
	// is running in jetpack
	require_once __DIR__ . '/server/class.jetpack-sync-test-object-factory.php';
}

/**
 * Tests all known implementations of the replicastore
 */
class WP_Test_IJetpack_Sync_Replicastore extends TestCase {
	/** @var JetpackSyncTestObjectFactory $factory */
	public static $factory;
	public static $token;
	public static $all_replicastores;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$token = (object) array(
			'blog_id'          => 101881278, // newsite16.goldsounds.com
			'user_id'          => 282285,   // goldsounds
			'external_user_id' => 2,
			'role'             => 'administrator',
		);

		self::$factory = new JetpackSyncTestObjectFactory();
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			switch_to_blog( self::$token->blog_id );
		}

		// this is a hack so that our setUp method can access the $store instance and call reset()
		$prop = new ReflectionProperty( 'PHPUnit_Framework_TestCase', 'data' );
		$prop->setAccessible( true );
		$test_data = $prop->getValue( $this );

		if ( isset( $test_data[0] ) && $test_data[0] ) {
			$store = $test_data[0];
			$store->reset();
		}
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			restore_current_blog();
		}
	}

	/**
	 * Test that the checksum values between implementations are the same
	 */
	public function test_all_checksums_match() {
		$this->markTestSkipped( 'Not a Valid E2E test.' );
		$post           = self::$factory->post( 5 );
		$second_post    = self::$factory->post( 10 );
		$comment        = self::$factory->comment( 3, $post->ID );
		$second_comment = self::$factory->comment( 6, $second_post->ID );

		// create an instance of each type of replicastore
		$all_replicastores = array();
		foreach ( get_declared_classes() as $class_name ) {
			if ( in_array( 'Automattic\\Jetpack\\Sync\\Replicastore_Interface', class_implements( $class_name ), true ) ) {
				if ( method_exists( $class_name, 'getInstance' ) ) {
					$all_replicastores[] = call_user_func( array( $class_name, 'getInstance' ) );
				} else {
					$all_replicastores[] = new $class_name();
				}
			}
		}

		// insert the same data into all of them
		foreach ( $all_replicastores as $replicastore ) {
			$replicastore->upsert_post( $post );
			$replicastore->upsert_metadata( 'post', $post->ID, 'imagedata', 'bar', 1 );
			$replicastore->upsert_metadata( 'post', $post->ID, 'publicize_results', 'baz', 2 );
			$replicastore->upsert_post( $second_post );
			$replicastore->upsert_metadata( 'post', $second_post->ID, 'imagedata', 'bar', 5 );
			$replicastore->upsert_metadata( 'post', $second_post->ID, 'publicize_results', 'baz', 10 );
			$replicastore->upsert_comment( $comment );
			$replicastore->upsert_metadata( 'comment', $comment->comment_ID, 'hc_avatar', 'bar', 1 );
			$replicastore->upsert_metadata( 'comment', $comment->comment_ID, 'hc_post_as', 'baz', 4 );
			$replicastore->upsert_comment( $second_comment );
			$replicastore->upsert_metadata( 'comment', $second_comment->comment_ID, 'hc_avatar', 'boo', 7 );
			$replicastore->upsert_metadata( 'comment', $second_comment->comment_ID, 'hc_post_as', 'bee', 10 );
		}

		// ensure the checksums are the same
		$checksums = array_map( array( $this, 'get_all_checksums' ), $all_replicastores );

		// for helpful debug output in case they don't match
		$labelled_checksums = array_combine( array_map( 'get_class', $all_replicastores ), $checksums );

		// find unique checksums - if all checksums are the same, there should be only one element
		$unique_checksums_count = count( array_unique( array_map( 'serialize', array_values( $checksums ) ) ) );

		$this->assertSame( 1, $unique_checksums_count, 'Checksums do not match: ' . print_r( $labelled_checksums, 1 ) );

		// compare post histograms
		$histograms              = array_map( array( $this, 'get_all_post_histograms' ), $all_replicastores );
		$labelled_histograms     = array_combine( array_map( 'get_class', $all_replicastores ), $histograms );
		$unique_histograms_count = count( array_unique( array_map( 'serialize', $histograms ) ) );
		$this->assertSame( 1, $unique_histograms_count, 'Post histograms do not match: ' . print_r( $labelled_histograms, 1 ) );

		$histograms              = array_map( array( $this, 'get_all_post_meta_histograms' ), $all_replicastores );
		$labelled_histograms     = array_combine( array_map( 'get_class', $all_replicastores ), $histograms );
		$unique_histograms_count = count( array_unique( array_map( 'serialize', $histograms ) ) );
		$this->assertSame( 1, $unique_histograms_count, 'Post meta histograms do not match: ' . print_r( $labelled_histograms, 1 ) );

		// compare comment histograms
		$histograms              = array_map( array( $this, 'get_all_comment_histograms' ), $all_replicastores );
		$labelled_histograms     = array_combine( array_map( 'get_class', $all_replicastores ), $histograms );
		$unique_histograms_count = count( array_unique( array_map( 'serialize', $histograms ) ) );
		$this->assertSame( 1, $unique_histograms_count, 'Comment histograms do not match: ' . print_r( $labelled_histograms, 1 ) );

		$histograms              = array_map( array( $this, 'get_all_comment_meta_histograms' ), $all_replicastores );
		$labelled_histograms     = array_combine( array_map( 'get_class', $all_replicastores ), $histograms );
		$unique_histograms_count = count( array_unique( array_map( 'serialize', $histograms ) ) );
		$this->assertSame( 1, $unique_histograms_count, 'Comment meta histograms do not match: ' . print_r( $labelled_histograms, 1 ) );
	}

	public function get_all_checksums( $replicastore ) {
		return $replicastore->checksum_all();
	}

	public function get_all_post_histograms( $replicastore ) {
		return $replicastore->checksum_histogram( 'posts', 10 );
	}

	public function get_all_post_meta_histograms( $replicastore ) {
		return $replicastore->checksum_histogram( 'post_meta', 10 );
	}

	public function get_all_comment_histograms( $replicastore ) {
		return $replicastore->checksum_histogram( 'comments', 10 );
	}

	public function get_all_comment_meta_histograms( $replicastore ) {
		return $replicastore->checksum_histogram( 'comment_meta', 10 );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_checksum_with_id_range( $store ) {
		$post           = self::$factory->post( 5 );
		$second_post    = self::$factory->post( 10 );
		$comment        = self::$factory->comment( 3, $post->ID );
		$second_comment = self::$factory->comment( 6, $second_post->ID );

		$store->upsert_post( $post );
		$store->upsert_metadata( 'post', $post->ID, 'imagedata', 'bar', 1 );
		$store->upsert_metadata( 'post', $post->ID, 'publicize_results', 'baz', 2 );
		$store->upsert_post( $second_post );
		$store->upsert_metadata( 'post', $second_post->ID, 'imagedata', 'bar', 5 );
		$store->upsert_metadata( 'post', $second_post->ID, 'publicize_results', 'baz', 10 );
		$store->upsert_comment( $comment );
		$store->upsert_metadata( 'comment', $comment->comment_ID, 'hc_avatar', 'bar', 1 );
		$store->upsert_metadata( 'comment', $comment->comment_ID, 'hc_post_as', 'baz', 4 );
		$store->upsert_comment( $second_comment );
		$store->upsert_metadata( 'comment', $second_comment->comment_ID, 'hc_avatar', 'boo', 7 );
		$store->upsert_metadata( 'comment', $second_comment->comment_ID, 'hc_post_as', 'bee', 10 );

		// test posts checksum with ID range
		$histogram = $store->checksum_histogram( 'posts', 2 );
		$this->assertEquals( $store->posts_checksum( 0, 5 ), $histogram['5'] );
		$this->assertEquals( $store->posts_checksum( 6, 10 ), $histogram['10'] );

		// test postmeta checksum with ID range
		$histogram = $store->checksum_histogram( 'post_meta', 2 );

		// temporary hack due to missing post_meta_checksum implementation in the test replicastore
		if ( 'Jetpack_Sync_Test_Replicastore' !== get_class( $store ) ) {
			$this->assertEquals( $store->post_meta_checksum( 1, 2 ), $histogram['1-2'] );
			$this->assertEquals( $store->post_meta_checksum( 5, 10 ), $histogram['5-10'] );
		}

		// test comments checksum with ID range
		$histogram = $store->checksum_histogram( 'comments', 2 );
		$this->assertEquals( $store->comments_checksum( 0, 5 ), $histogram['3'] );
		$this->assertEquals( $store->comments_checksum( 6, 10 ), $histogram['6'] );

		// test commentmeta checksum with ID range
		$histogram = $store->checksum_histogram( 'comment_meta', 2 );

		// temporary hack due to missing comment_meta_checksum implementation in the test replicastore
		if ( 'Jetpack_Sync_Test_Replicastore' !== get_class( $store ) ) {
			$this->assertEquals( $store->comment_meta_checksum( 1, 4 ), $histogram['1-4'] );
			$this->assertEquals( $store->comment_meta_checksum( 7, 10 ), $histogram['7-10'] );
		}
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_does_not_checksum_spam_comments( $store ) {
		$comment       = self::$factory->comment( 3, 1 );
		$spam_comment  = self::$factory->comment( 6, 1, array( 'comment_approved' => 'spam' ) );
		$trash_comment = self::$factory->comment( 9, 1, array( 'comment_approved' => 'trash' ) );

		$store->upsert_comment( $comment );
		$store->upsert_comment( $trash_comment );

		$checksum = $store->comments_checksum();

		// add a spam comment and assert that checksum didn't change
		$store->upsert_comment( $spam_comment );

		$this->assertEquals( $checksum, $store->comments_checksum() );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_strips_non_ascii_chars_for_checksum( $store ) {
		$utf8_post     = self::$factory->post( 1, array( 'post_content' => 'Panamá' ) );
		$ascii_post    = self::$factory->post( 1, array( 'post_content' => 'Panam' ) );
		$utf8_comment  = self::$factory->comment( 1, 1, array( 'comment_content' => 'Panamá' ) );
		$ascii_comment = self::$factory->comment( 1, 1, array( 'comment_content' => 'Panam' ) );

		// Generate checksums just for utf8 content.
		$store->upsert_post( $utf8_post );
		$store->upsert_comment( $utf8_comment );

		$utf8_post_checksum    = $store->posts_checksum();
		$utf8_comment_checksum = $store->comments_checksum();

		// Generate checksums just for ascii content.
		// We need to set the $ascii_post post_modified field
		// same as the $utf8_post post_modified, as post checksums take it into account, in order
		// to avoid any flakiness caused by those two posts having different post_modified fields (defaults to now).
		$ascii_post->post_modified = $utf8_post->post_modified;
		$store->upsert_post( $ascii_post );
		$store->upsert_comment( $ascii_comment );

		$ascii_post_checksum    = $store->posts_checksum();
		$ascii_comment_checksum = $store->comments_checksum();

		$this->assertEquals( $utf8_post_checksum, $ascii_post_checksum );
		$this->assertEquals( $utf8_comment_checksum, $ascii_comment_checksum );
	}

	/**
	 * Histograms
	 **/

	/**
	 * @dataProvider store_provider
	 */
	public function test_checksum_histogram( $store ) {

		$min_post_id           = 1000000;
		$max_post_id           = 1;
		$min_comment_id        = 1000000;
		$max_comment_id        = 1;
		$generated_post_ids    = array();
		$generated_comment_ids = array();

		for ( $i = 1; $i <= 20; $i++ ) {
			do {
				$post_id = wp_rand( 1, 1000000 );
			} while ( in_array( $post_id, $generated_post_ids, true ) );

			$generated_post_ids[] = $post_id;

			$post = self::$factory->post( $post_id, array( 'post_content' => "Test post $i" ) );
			$store->upsert_post( $post );
			if ( $min_post_id > $post_id ) {
				$min_post_id = $post_id;
			}

			if ( $max_post_id < $post_id ) {
				$max_post_id = $post_id;
			}

			do {
				$comment_id = wp_rand( 1, 1000000 );
			} while ( in_array( $comment_id, $generated_comment_ids, true ) );

			$generated_comment_ids[] = $comment_id;

			$comment = self::$factory->comment( $comment_id, $post_id, array( 'comment_content' => "Test comment $i" ) );
			$store->upsert_comment( $comment );

			if ( $min_comment_id > $comment_id ) {
				$min_comment_id = $comment_id;
			}

			if ( $max_comment_id < $comment_id ) {
				$max_comment_id = $comment_id;
			}
		}

		foreach ( array( 'posts', 'comments' ) as $object_type ) {
			$histogram = $store->checksum_histogram( $object_type, 10, 0, 0 );
			$this->assertCount( 10, $histogram );

			// histogram bucket should equal entire histogram of just the ID range for that bucket
			foreach ( $histogram as $range => $checksum ) {
				list( $min_id, $max_id ) = explode( '-', $range );

				$range_histogram = $store->checksum_histogram( $object_type, 1, (int) $min_id, (int) $max_id );
				$range_checksum  = array_pop( $range_histogram );

				$this->assertEquals( $checksum, $range_checksum );
			}
		}

		// histogram with one bucket should equal checksum of corresponding object type
		$histogram = $store->checksum_histogram( 'posts', 1, 0, 0 );
		$this->assertEquals( $store->posts_checksum(), $histogram[ "$min_post_id-$max_post_id" ] );

		$histogram = $store->checksum_histogram( 'comments', 1, 0, 0 );
		$this->assertEquals( $store->comments_checksum(), $histogram[ "$min_comment_id-$max_comment_id" ] );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_checksum_posts_return_different_values_on_enej_case( $store ) {
		$store->reset();
		$post = self::$factory->post( 807 );
		$store->upsert_post( $post );
		$post = self::$factory->post( 811 );
		$store->upsert_post( $post );
		$post = self::$factory->post( 816 );
		$store->upsert_post( $post );
		$before_checksum = $store->posts_checksum();
		$post            = self::$factory->post( 812 );
		$store->upsert_post( $post );
		$post = self::$factory->post( 813 );
		$store->upsert_post( $post );
		$post = self::$factory->post( 814 );
		$store->upsert_post( $post );
		$post = self::$factory->post( 815 );
		$store->upsert_post( $post );
		$after_checksum = $store->posts_checksum();
		$this->assertNotEquals( $before_checksum, $after_checksum );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_histogram_accepts_columns( $store ) {
		for ( $i = 1; $i <= 20; $i++ ) {
			$post = self::$factory->post( $i, array( 'post_content' => "Test post $i" ) );
			$store->upsert_post( $post );

			$comment = self::$factory->comment( $i, $i, array( 'comment_content' => "Test comment $i" ) );
			$store->upsert_comment( $comment );
		}

		$histogram = $store->checksum_histogram( 'posts', 20, 0, 0, array( 'post_content' ) );

		$post_checksum = $histogram['1'];

		$this->assertEquals( $post_checksum, (string) crc32( implode( '#', array( '', 'Test post 1' ) ) ) );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_histogram_detects_missing_columns( $store ) {
		global $wpdb;
		$suppressed            = $wpdb->suppress_errors;
		$wpdb->suppress_errors = true;

		if ( $store instanceof Jetpack_Sync_Test_Replicastore ) {
			$this->markTestIncomplete( "The Test replicastore doesn't support detecting missing columns" );
		}

		// check what happens when we pass in an invalid column
		$histogram = $store->checksum_histogram( 'posts', 20, 0, 0, array( 'this_column_doesnt_exist' ) );

		if ( ! empty( $histogram ) ) {
			$this->assertTrue( is_wp_error( $histogram ) );
		} else {
			$this->assertIsArray( $histogram );
		}

		$wpdb->suppress_errors = $suppressed;
	}

	/**
	 * Posts
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_upsert_post( $store ) {
		$this->assertSame( 0, $store->post_count() );

		$post = self::$factory->post( 5 );

		$store->upsert_post( $post );

		$retrieved_post = $store->get_post( $post->ID );

		// author is modified on save by the wpcom shadow replicastore
		unset( $post->post_author );
		unset( $retrieved_post->post_author );

		$this->assertEquals( $post, $retrieved_post );

		// assert the DB has one post
		$this->assertSame( 1, $store->post_count() );

		// test that re-upserting doesn't add a new post, but modifies existing one
		$post->post_title = 'A whole new title';
		$store->upsert_post( $post );
		$replica_post = $store->get_post( $post->ID );

		$this->assertEquals( 'A whole new title', $replica_post->post_title );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_get_posts( $store ) {
		$store->upsert_post( self::$factory->post( 1, array( 'post_status' => 'draft' ) ) );
		$store->upsert_post( self::$factory->post( 2, array( 'post_status' => 'publish' ) ) );
		$store->upsert_post( self::$factory->post( 3, array( 'post_status' => 'trash' ) ) );
		$store->upsert_post( self::$factory->post( 4, array( 'post_status' => 'trash' ) ) );

		$this->assertSame( 1, $store->post_count( 'draft' ) );
		$this->assertSame( 1, $store->post_count( 'publish' ) );
		$this->assertEquals( 2, $store->post_count( 'trash' ) );

		$trash_posts = $store->get_posts( 'trash' );

		$this->assertCount( 2, $trash_posts );

		// now let's delete a post
		$store->delete_post( 3 );

		$this->assertNull( $store->get_post( 3 ) );
		$this->assertSame( 1, $store->post_count( 'trash' ) );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_checksum_posts( $store ) {
		$before_checksum = $store->posts_checksum();

		$post = self::$factory->post( 5 );

		$store->upsert_post( $post );

		$this->assertNotEquals( $before_checksum, $store->posts_checksum() );
	}

	/**
	 * Comments
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_upsert_comment( $store ) {
		$this->assertSame( 0, $store->comment_count() );

		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );

		$this->assertSame( 1, $store->comment_count() );

		$retrieved_comment = $store->get_comment( $comment->comment_ID );

		// insane hack because sometimes MySQL retrurns dates that are off by a second or so. WTF?
		unset( $comment->comment_date );
		unset( $comment->comment_date_gmt );
		unset( $retrieved_comment->comment_date );
		unset( $retrieved_comment->comment_date_gmt );

		if ( $store instanceof Replicastore ) {
			$this->markTestIncomplete( "The WP replicastore doesn't support setting comments post_fields" );
		}

		$this->assertEquals( $comment, $retrieved_comment );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_checksum_comments( $store ) {
		$before_checksum = $store->comments_checksum();

		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );

		$this->assertNotEquals( $before_checksum, $store->comments_checksum() );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_get_comments( $store ) {
		$post_id = 1;
		self::$factory->post( $post_id, array( 'post_status' => 'publish' ) );
		$store->upsert_comment( self::$factory->comment( 1, $post_id, array( 'comment_approved' => '0' ) ) );
		$store->upsert_comment( self::$factory->comment( 2, $post_id, array( 'comment_approved' => '1' ) ) );
		$store->upsert_comment( self::$factory->comment( 3, $post_id, array( 'comment_approved' => 'spam' ) ) );
		$store->upsert_comment( self::$factory->comment( 4, $post_id, array( 'comment_approved' => 'spam' ) ) );
		$store->upsert_comment( self::$factory->comment( 5, $post_id, array( 'comment_approved' => 'trash' ) ) );

		$this->assertSame( 1, $store->comment_count( 'hold' ) );
		$this->assertSame( 1, $store->comment_count( 'approve' ) );
		$this->assertSame( 1, $store->comment_count( 'trash' ) );
		$this->assertEquals( 2, $store->comment_count( 'spam' ) );
	}

	/**
	 * Options
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_update_option( $store ) {
		$option_name  = 'blogdescription';
		$option_value = (string) rand();
		$store->update_option( $option_name, $option_value );
		$replica_option_value = $store->get_option( $option_name );

		$this->assertEquals( $option_value, $replica_option_value );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_delete_option( $store ) {
		$option_name  = 'test_replicastore_' . rand();
		$option_value = (string) rand();
		$store->update_option( $option_name, $option_value );
		$store->delete_option( $option_name );
		$replica_option_value = $store->get_option( $option_name );

		$this->assertFalse( $replica_option_value );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_set_theme_support( $store ) {

		if ( $store instanceof Replicastore ) {
			$this->markTestIncomplete( "The WP replicastore doesn't support setting theme options directly" );
		}

		$theme_features = array(
			'automatic-feed-links'      => true,
			'title-tag'                 => true,
			'post-thumbnails'           => true,
			'menus'                     => true,
			'html5'                     =>
				array(
					0 =>
						array(
							0 => 'search-form',
							1 => 'comment-form',
							2 => 'comment-list',
							3 => 'gallery',
							4 => 'caption',
						),
				),
			'post-formats'              =>
				array(
					0 =>
						array(
							0 => 'aside',
							1 => 'image',
							2 => 'video',
							3 => 'quote',
							4 => 'link',
							5 => 'gallery',
							6 => 'status',
							7 => 'audio',
							8 => 'chat',
						),
				),
			'custom-background'         =>
				array(
					0 =>
						array(
							'default-image'          => '',
							'default-repeat'         => 'repeat',
							'default-position-x'     => 'left',
							'default-attachment'     => 'fixed',
							'default-color'          => 'f1f1f1',
							'wp-head-callback'       => '_custom_background_cb',
							'admin-head-callback'    => '',
							'admin-preview-callback' => '',
						),
				),
			'editor-style'              => true,
			'custom-header'             =>
				array(
					0 =>
						array(
							'default-image'          => '',
							'random-default'         => false,
							'width'                  => 954,
							'height'                 => 1300,
							'flex-height'            => false,
							'flex-width'             => false,
							'default-text-color'     => '333333',
							'header-text'            => true,
							'uploads'                => true,
							'wp-head-callback'       => 'twentyfifteen_header_style',
							'admin-head-callback'    => '',
							'admin-preview-callback' => '',
						),
				),
			'jetpack-responsive-videos' => true,
			'site-logo'                 =>
				array(
					0 =>
						array(
							'size' => 'twentyfifteen-logo',
						),
				),
			'infinite-scroll'           =>
				array(
					0 =>
						array(
							'container' => 'main',
							'footer'    => 'page',
						),
				),
			'widgets'                   => true,
			'custom_colors_extra_css'   =>
				array(
					0 => 'twentyfifteen_extra_css',
				),
		);

		$store->set_callable( 'theme_support', $theme_features );

		// the "current_theme_supports" API is only supposed to return "true" if there's a setting
		foreach ( $theme_features as $theme_feature => $theme_feature_value ) {
			$replica_theme_support_value = $store->current_theme_supports( $theme_feature );
			$this->assertEquals( $theme_feature_value || false, $replica_theme_support_value );
		}
	}

	/**
	 * Meta
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_reset_preserves_internal_keys( $store ) {
		if ( $store instanceof Jetpack_Sync_Test_Replicastore ) {
			$this->markTestIncomplete( 'Test replicastore resets fully every time - this is only necessary on WPCOM' );
		}

		$store->upsert_post( self::$factory->post( 1 ) );

		$store->upsert_metadata( 'post', 1, 'foo', 'bar', 3 );
		$store->upsert_metadata( 'post', 1, '_fee', 'baz', 4 );

		$store->reset();

		// sadly this is still necessary since we're bulk deleting post meta
		// but not bulk-cache-invalidating it
		wp_cache_delete( 1, 'post_meta' );

		$this->assertNull( $store->get_metadata( 'post', 1, 'foo', true ) );
		$this->assertEquals( 'baz', $store->get_metadata( 'post', 1, '_fee', true ) );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_update_meta( $store ) {
		$store->upsert_post( self::$factory->post( 1 ) );

		$store->upsert_metadata( 'post', 1, 'foo', 'bar', 3 );

		$this->assertEquals( array( 'bar' ), $store->get_metadata( 'post', 1, 'foo' ) );

		$store->delete_metadata( 'post', 1, array( 3 ) );

		$this->assertEquals( array(), $store->get_metadata( 'post', 1, 'foo' ) );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_update_meta_array( $store ) {
		$meta_array = array(
			'trees' => 'green',
			'ocean' => 'blue',
		);

		$store->upsert_post( self::$factory->post( 1 ) );
		$store->upsert_metadata( 'post', 1, 'colors', $meta_array, 3 );

		$color_meta = $store->get_metadata( 'post', 1, 'colors' );

		$this->assertEquals( $meta_array, $color_meta[0] );
	}

	/**
	 * Constants
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_set_constant( $store ) {
		$this->assertNull( $store->get_constant( 'FOO' ) );

		$store->set_constant( 'FOO', array( 'foo' => 'bar' ) );

		$this->assertEquals( array( 'foo' => 'bar' ), $store->get_constant( 'FOO' ) );
	}

	/**
	 * Updates
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_set_updates( $store ) {
		$this->assertNull( $store->get_updates( 'core' ) );

		$store->set_updates( 'core', 1 );

		$this->assertSame( 1, $store->get_updates( 'core' ) );
	}

	/**
	 * Callables
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_set_callables( $store ) {
		if ( $store instanceof Replicastore ) {
			$this->markTestIncomplete( "The WP replicastore doesn't support setting callables directly" );
		}

		$this->assertNull( $store->get_callable( 'is_main_network' ) );

		$store->set_callable( 'is_main_network', '1' );

		$this->assertSame( '1', $store->get_callable( 'is_main_network' ) );
	}

	/**
	 * Site (aka Network) options
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_set_site_options( $store ) {
		$this->assertFalse( $store->get_site_option( 'foo' ), 'Site option Not empty.' );

		$store->update_site_option( 'foo', 'bar' );

		$this->assertEquals( 'bar', $store->get_site_option( 'foo' ), 'Site option Not bar.' );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_delete_site_option( $store ) {
		$store->update_site_option( 'to_delete', 'me' );

		$this->assertEquals( 'me', $store->get_site_option( 'to_delete' ), 'Site option is NOT set to me.' );

		$store->delete_site_option( 'to_delete' );

		$this->assertFalse( $store->get_site_option( 'to_delete' ), 'Site option was NOT deleted.' );
	}

	/**
	 * Users
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_update_users( $store ) {
		if ( $store instanceof Replicastore ) {
			$this->markTestIncomplete( "The WP replicastore doesn't support setting users" );
		}

		$this->assertNull( $store->get_user( 12 ) );

		$user = self::$factory->user( 12, 'example_user' );

		$store->upsert_user( $user );

		$this->assertNotNull( $store->get_user( 12 ) );

		// delete stuff that shouldn't be included because we don't sync that data
		unset( $user->data->user_activation_key );

		$stored_user = $store->get_user( 12 );

		if ( $store instanceof Jetpack_Sync_WPCOM_Shadow_Replicastore ) {
			$this->assertEquals( $user->ID, $stored_user->external_user_id );
			$this->assertFalse( isset( $user->data->user_activation_key ) );
		} else {
			$this->assertEquals( $user->ID, $stored_user->ID );
		}

		$this->assertEquals( $user->data->user_login, $stored_user->data->user_login );
		$this->assertEquals( $user->data->user_nicename, $stored_user->data->user_nicename );
		$this->assertEquals( $user->data->user_email, $stored_user->data->user_email );
		$this->assertEquals( $user->data->user_url, $stored_user->data->user_url );
		$this->assertEquals( $user->data->user_registered, $stored_user->data->user_registered );
		$this->assertEquals( $user->data->user_status, $stored_user->data->user_status );
		$this->assertEquals( $user->data->display_name, $stored_user->data->display_name );

		$store->delete_user( 12 );

		$this->assertNull( $store->get_user( 12 ) );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_get_allowed_mime_types( $store ) {
		if ( $store instanceof Replicastore ) {
			$this->markTestIncomplete( "The WP replicastore doesn't support setting users" );
		}

		$this->assertNull( $store->get_user( 12 ) );

		$user                    = self::$factory->user( 12, 'example_user' );
		$user_allowed_mime_types = $user->data->allowed_mime_types;
		$store->upsert_user( $user );
		$this->assertEquals( $user_allowed_mime_types, $store->get_allowed_mime_types( 12 ) );
	}

	/**
	 * Terms
	 */

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_update_terms( $store ) {
		$taxonomy = 'test_shadow_taxonomy_term';

		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = self::$factory->term(
			22,
			array(
				'name'             => 'Female',
				'slug'             => 'female',
				'term_taxonomy_id' => 22,
				'taxonomy'         => $taxonomy,
			)
		);

		$this->assertEmpty( $store->get_term( $term_object->taxonomy, $term_object->term_id ) );

		$store->update_term( $term_object );

		$term = $store->get_term( $term_object->taxonomy, $term_object->term_id );

		$this->assertEquals( (array) $term_object, (array) $term );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_delete_terms( $store ) {
		$taxonomy = 'test_shadow_taxonomy_term';

		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = self::$factory->term(
			22,
			array(
				'name'             => 'Female',
				'slug'             => 'female',
				'term_taxonomy_id' => 22,
				'taxonomy'         => $taxonomy,
			)
		);

		$store->update_term( $term_object );

		$store->delete_term( $term_object->term_id, $taxonomy );

		$this->assertEmpty( $store->get_term( $term_object->taxonomy, $term_object->term_id ) );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_update_post_terms( $store ) {
		$taxonomy = 'test_shadow_taxonomy_term';
		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = self::$factory->term(
			22,
			array(
				'name'             => 'Female',
				'slug'             => 'female',
				'term_taxonomy_id' => 22,
				'taxonomy'         => $taxonomy,
			)
		);

		$store->update_term( $term_object );

		$post = self::$factory->post( 5 );
		$store->upsert_post( $post );
		$replica_post = $store->get_post( 5 );

		$store->update_object_terms( $replica_post->ID, $taxonomy, array( 22 ), true );

		$terms = $store->get_the_terms( $replica_post->ID, $taxonomy );

		$this->assertSame( 1, $terms[0]->count );
		$this->assertEquals( 22, $terms[0]->term_id );
		$this->assertEquals( 22, $terms[0]->term_taxonomy_id );
		$this->assertEquals( 'female', $terms[0]->slug );
		$this->assertEquals( 'Female', $terms[0]->name );
	}

	/**
	 * @dataProvider store_provider
	 */
	public function test_replica_delete_post_terms( $store ) {
		$this->markTestIncomplete( 'contains SQL' );
		global $wpdb;
		$taxonomy = 'test_shadow_taxonomy_term';

		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = (object) array(
			'term_id'          => 22,
			'name'             => 'Female',
			'slug'             => 'female',
			'term_group'       => 0,
			'term_taxonomy_id' => 22,
			'taxonomy'         => $taxonomy,
			'description'      => '',
			'parent'           => 0,
			'count'            => 0,
			'filter'           => 'raw',
		);

		$store->update_term( $term_object );

		$post = self::$factory->post( 5 );
		$store->upsert_post( $post );
		$replica_post = $store->get_post( 5 );

		$store->update_object_terms( $replica_post->ID, $taxonomy, array( 22 ), true );

		$terms = get_the_terms( $replica_post->ID, $taxonomy );
		$this->assertSame( 1, $terms[0]->count );

		$store->delete_object_terms( $replica_post->ID, array( 22 ) );

		$this->assertNull( $wpdb->get_row( "SELECT * FROM $wpdb->term_relationships WHERE object_id = 5 " ) );

		$terms = get_the_terms( $replica_post->ID, $taxonomy );
		$this->assertSame( 0, $terms[0]->count );
	}

	public function store_provider( $name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! self::$all_replicastores ) {
			// detect classes that implement iJetpack_Sync_Replicastore
			self::$all_replicastores = array();

			foreach ( get_declared_classes() as $class_name ) {
				if ( in_array( 'Automattic\\Jetpack\\Sync\\Replicastore_Interface', class_implements( $class_name ), true ) ) {
					self::$all_replicastores[] = $class_name;
				}
			}
		}

		$return = array();

		foreach ( self::$all_replicastores as $replicastore_class ) {
			if ( method_exists( $replicastore_class, 'getInstance' ) ) {
				$instance = call_user_func( array( $replicastore_class, 'getInstance' ) );
			} else {
				$instance = new $replicastore_class();
			}

			$return[] = array( $instance );
		}

		return $return;
	}

	private function ensure_synced_taxonomy( $store, $slug, $type = 'post' ) {
		register_taxonomy(
			$slug,
			$type,
			array(
				'label'        => $slug,
				'rewrite'      => array( 'slug' => $slug ),
				'hierarchical' => true,
			)
		);

		// fetch the taxonomy, sync it then delete it
		global $wp_taxonomies;

		$store->set_callable( 'taxonomies', array( $slug => $wp_taxonomies[ $slug ] ) );

		// Commented out for now. unregister_taxonomy( $slug );
	}
}
