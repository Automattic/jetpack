<?php

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once ABSPATH . 'wp-content/mu-plugins/jetpack/sync/class.jetpack-sync-test-object-factory.php';
} else {
	// is running in jetpack
	require_once dirname( __FILE__ ) . '/server/class.jetpack-sync-test-object-factory.php';
}

/*
 * Tests all known implementations of the replicastore
 *
 * @requires PHP 5.3
 */
class WP_Test_iJetpack_Sync_Replicastore extends PHPUnit_Framework_TestCase {
	/** @var JetpackSyncTestObjectFactory $factory */
	static $factory;
	static $token;
	static $all_replicastores;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		self::$token   = (object) array(
			'blog_id'          => 101881278, //newsite16.goldsounds.com
			'user_id'          => 282285,   //goldsounds
			'external_user_id' => 2,
			'role'             => 'administrator'
		);

		self::$factory = new JetpackSyncTestObjectFactory();
	}

	function setUp() {
		parent::setUp();

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

	function tearDown() {
		parent::tearDown();

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			restore_current_blog();
		}
	}

	/**
	 * Test that the checksum values between implementations are the same
	 * @requires PHP 5.3
	 */
	function test_all_checksums_match() {
		$post = self::$factory->post( 5 );
		$comment = self::$factory->comment( 3, $post->ID );
		$option_name  = 'blogdescription';
		$option_value = rand();

		update_option( $option_name, $option_value );

		// create an instance of each type of replicastore
		$all_replicastores = array();
		foreach (get_declared_classes() as $className) {
			if (in_array('iJetpack_Sync_Replicastore', class_implements($className))) {
				if ( method_exists( $className, 'getInstance' ) ) {
					$all_replicastores[] = call_user_func( array( $className, 'getInstance' ) );
				} else {
					$all_replicastores[] = new $className();
				}
			}
		}

		// insert the same data into all of them
		foreach( $all_replicastores as $replicastore ) {
			$replicastore->upsert_post( $post );
			$replicastore->upsert_comment( $comment );
			$replicastore->update_option( $option_name, $option_value );
		}

		// just check the option we updated in the replicastores
		$default_options_whitelist_original = Jetpack_Sync_Defaults::$default_options_whitelist;
		Jetpack_Sync_Defaults::$default_options_whitelist = array( 'blogdescription' );

		// ensure the checksums are the same
		$checksums = array_map( array( $this, 'get_all_checksums' ), $all_replicastores );
		// set the class property back to the original value;
		Jetpack_Sync_Defaults::$default_options_whitelist = $default_options_whitelist_original;

		$labelled_checksums = array_combine( array_map( 'get_class', $all_replicastores ), $checksums );

		// find unique checksums - if all checksums are the same, there should be only one element
		$unique_checksums_count = count( array_unique( array_map( 'serialize', $checksums ) ) );

		$this->assertEquals( 1, $unique_checksums_count, 'Checksums not unique: ' . print_r( $labelled_checksums, 1 ) );
	}

	function get_all_checksums( $replicastore ) {
		return $replicastore->checksum_all();
	}

	/**
	 * Posts
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_upsert_post( $store ) {
		$this->assertEquals( 0, $store->post_count() );

		$post = self::$factory->post( 5 );

		$store->upsert_post( $post );

		$retrieved_post = $store->get_post( $post->ID );

		// author is modified on save by the wpcom shadow replicastore
		unset($post->post_author);
		unset($retrieved_post->post_author);

		$this->assertEquals( $post, $retrieved_post );

		// assert the DB has one post
		$this->assertEquals( 1, $store->post_count() );

		// test that re-upserting doesn't add a new post, but modifies existing one
		$post->post_title = "A whole new title";
		$store->upsert_post( $post );
		$replica_post = $store->get_post( $post->ID );

		$this->assertEquals( "A whole new title", $replica_post->post_title );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_get_posts( $store ) {
		$store->upsert_post( self::$factory->post( 1, array( 'post_status' => 'draft' ) ) );
		$store->upsert_post( self::$factory->post( 2, array( 'post_status' => 'publish' ) ) );
		$store->upsert_post( self::$factory->post( 3, array( 'post_status' => 'trash' ) ) );
		$store->upsert_post( self::$factory->post( 4, array( 'post_status' => 'trash' ) ) );

		$this->assertEquals( 1, $store->post_count( 'draft' ) );
		$this->assertEquals( 1, $store->post_count( 'publish' ) );
		$this->assertEquals( 2, $store->post_count( 'trash' ) );

		$trash_posts = $store->get_posts( 'trash' );

		$this->assertEquals( 2, count( $trash_posts ) );

		// now let's delete a post
		$store->delete_post( 3 );

		$this->assertEquals( null, $store->get_post( 3 ) );
		$this->assertEquals( 1, $store->post_count( 'trash' ) );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_checksum_posts( $store ) {
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
	 * @requires PHP 5.3
	 */
	function test_replica_upsert_comment( $store ) {
		$this->assertEquals( 0, $store->comment_count() );

		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );

		$this->assertEquals( 1, $store->comment_count() );

		$retrieved_comment = $store->get_comment( $comment->comment_ID );

		// insane hack because sometimes MySQL retrurns dates that are off by a second or so. WTF?
		unset($comment->comment_date);
		unset($comment->comment_date_gmt);
		unset($retrieved_comment->comment_date);
		unset($retrieved_comment->comment_date_gmt);

		if ( $store instanceof Jetpack_Sync_WP_Replicastore ) {
			$this->markTestIncomplete("The WP replicastore doesn't support setting comments post_fields");
		}

		$this->assertEquals( $comment, $retrieved_comment );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_checksum_comments( $store ) {
		$before_checksum = $store->comments_checksum();

		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );

		$this->assertNotEquals( $before_checksum, $store->comments_checksum() );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_get_comments( $store ) {
		$post_id = 1;
		self::$factory->post( $post_id, array( 'post_status' => 'publish' ) );
		$store->upsert_comment( self::$factory->comment( 1, $post_id, array( 'comment_approved' => '0' ) ) );
		$store->upsert_comment( self::$factory->comment( 2, $post_id, array( 'comment_approved' => '1' ) ) );
		$store->upsert_comment( self::$factory->comment( 3, $post_id, array( 'comment_approved' => 'spam' ) ) );
		$store->upsert_comment( self::$factory->comment( 4, $post_id, array( 'comment_approved' => 'spam' ) ) );
		$store->upsert_comment( self::$factory->comment( 5, $post_id, array( 'comment_approved' => 'trash' ) ) );

		$this->assertEquals( 1, $store->comment_count( 'hold' ) );
		$this->assertEquals( 1, $store->comment_count( 'approve' ) );
		$this->assertEquals( 1, $store->comment_count( 'trash' ) );
		$this->assertEquals( 2, $store->comment_count( 'spam' ) );
	}

	/**
	 * Options
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_update_option( $store ) {
		$option_name  = 'blogdescription';
		$option_value = rand();
		$store->update_option( $option_name, $option_value );
		$replica_option_value = $store->get_option( $option_name );

		$this->assertEquals( $option_value, $replica_option_value );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_delete_option( $store ) {
		$option_name  = 'test_replicastore_' . rand();
		$option_value = rand();
		$store->update_option( $option_name, $option_value );
		$store->delete_option( $option_name );
		$replica_option_value = $store->get_option( $option_name );

		$this->assertFalse( $replica_option_value );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_set_theme_support( $store ) {

		if ( $store instanceof Jetpack_Sync_WP_Replicastore ) {
			$this->markTestIncomplete("The WP replicastore doesn't support setting theme options directly");
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

		$store->set_theme_support( $theme_features );

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
	 * @requires PHP 5.3
	 */
	function test_replica_reset_preserves_internal_keys( $store ) {
		if ( $store instanceof Jetpack_Sync_Test_Replicastore ) {
			$this->markTestIncomplete( "Test replicastore resets fully every time - this is only necessary on WPCOM" );
		}

		$store->upsert_post( self::$factory->post( 1 ) );

		$store->upsert_metadata( 'post', 1, 'foo', 'bar', 3 );
		$store->upsert_metadata( 'post', 1, '_fee', 'baz', 4 );

		$store->reset();

		// sadly this is still necessary since we're bulk deleting post meta
		// but not bulk-cache-invalidating it
		wp_cache_delete( 1, 'post_meta' );

		$this->assertEquals( null, $store->get_metadata( 'post', 1, 'foo', true ) );
		$this->assertEquals( 'baz', $store->get_metadata( 'post', 1, '_fee', true ) );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_update_meta( $store ) {
		$store->upsert_post( self::$factory->post( 1 ) );

		$store->upsert_metadata( 'post', 1, 'foo', 'bar', 3 );

		$this->assertEquals( array( 'bar' ), $store->get_metadata( 'post', 1, 'foo' ) );

		$store->delete_metadata( 'post', 1, array( 3 ) );

		$this->assertEquals( array(), $store->get_metadata( 'post', 1, 'foo' ) );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_update_meta_array( $store ) {
		$meta_array = array( 'trees' => 'green', 'ocean' => 'blue' );

		$store->upsert_post( self::$factory->post( 1 ) );
		$store->upsert_metadata( 'post', 1, 'colors', $meta_array, 3 );

		$color_meta = $store->get_metadata( 'post', 1, 'colors' );

		$this->assertTrue( $this->arrays_are_similar( $meta_array, $color_meta[0] ) );
	}

	/**
	 * Determine if two associative arrays are similar
	 *
	 * Both arrays must have the same indexes with identical values
	 * without respect to key ordering
	 *
	 * @param array $a
	 * @param array $b
	 * @return bool
	 */
	function arrays_are_similar($a, $b) {
		// if the indexes don't match, return immediately
		if (count(array_diff_assoc($a, $b))) {
			return false;
		}
		// we know that the indexes, but maybe not values, match.
		// compare the values between the two arrays
		foreach($a as $k => $v) {
			if ($v !== $b[$k]) {
				return false;
			}
		}
		// we have identical indexes, and no unequal values
		return true;
	}

	/**
	 * Constants
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_set_constant( $store ) {
		$this->assertNull( $store->get_constant('FOO') );

		$store->set_constant( 'FOO', array( 'foo' => 'bar' ) );

		$this->assertEquals( array( 'foo' => 'bar' ), $store->get_constant('FOO') );
	}

	/**
	 * Updates
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_set_updates( $store ) {
		$this->assertNull( $store->get_updates( 'core' ) );

		$store->set_updates( 'core', 1 );

		$this->assertEquals( 1, $store->get_updates( 'core' ) );
	}

	/**
	 * Callables
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_set_callables( $store ) {
		if ( $store instanceof Jetpack_Sync_WP_Replicastore ) {
			$this->markTestIncomplete("The WP replicastore doesn't support setting callables directly");
		}

		$this->assertNull( $store->get_callable( 'is_main_network' ) );

		$store->set_callable( 'is_main_network', 'yes' );

		$this->assertEquals( 'yes', $store->get_callable( 'is_main_network' ) );
	}

	/**
	 * Site (aka Network) options
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_set_site_options( $store ) {
		$this->assertFalse( $store->get_site_option( 'foo' ), 'Site option Not empty.' );

		$store->update_site_option( 'foo', 'bar' );

		$this->assertEquals( 'bar', $store->get_site_option( 'foo' ), 'Site option Not bar.' );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_delete_site_option( $store ) {
		$store->update_site_option( 'to_delete', 'me' );

		$this->assertEquals( 'me', $store->get_site_option( 'to_delete' ), 'Site option is NOT set to me.' );

		$store->delete_site_option( 'to_delete' );

		$this->assertEquals( false, $store->get_site_option( 'to_delete' ), 'Site option was NOT deleted.' );
	}

	/**
	 * Users
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_update_users( $store ) {
		if ( $store instanceof Jetpack_Sync_WP_Replicastore ) {
			$this->markTestIncomplete("The WP replicastore doesn't support setting users");
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

		$this->assertEquals( $user->data->user_login,      $stored_user->data->user_login );
		$this->assertEquals( $user->data->user_nicename,   $stored_user->data->user_nicename );
		$this->assertEquals( $user->data->user_email,      $stored_user->data->user_email );
		$this->assertEquals( $user->data->user_url,        $stored_user->data->user_url );
		$this->assertEquals( $user->data->user_registered, $stored_user->data->user_registered );
		$this->assertEquals( $user->data->user_status,     $stored_user->data->user_status );
		$this->assertEquals( $user->data->display_name,    $stored_user->data->display_name );

		$store->delete_user( 12 );

		$this->assertNull( $store->get_user( 12 ) );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_get_allowed_mime_types( $store ) {
		if ( $store instanceof Jetpack_Sync_WP_Replicastore ) {
			$this->markTestIncomplete("The WP replicastore doesn't support setting users");
		}

		$this->assertNull( $store->get_user( 12 ) );

		$user = self::$factory->user( 12, 'example_user' );
		$user_allowed_mime_types = $user->data->allowed_mime_types;
		$store->upsert_user( $user );
		$this->assertEquals( $user_allowed_mime_types, $store->get_allowed_mime_types( 12 ) );
	}

	/**
	 * Terms
	 */

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	public function test_replica_update_terms( $store ) {
		$taxonomy = 'test_shadow_taxonomy_term';

		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = self::$factory->term( 22,
			array(
				'name' => 'Female',
				'slug' => 'female',
				'term_taxonomy_id' => 22,
				'taxonomy' => $taxonomy,
			)
		);

		$this->assertEmpty( $store->get_term( $term_object->taxonomy, $term_object->term_id ) );

		$store->update_term( $term_object );

		$term = $store->get_term( $term_object->taxonomy, $term_object->term_id );

		$this->assertEquals( (array)$term_object, (array)$term );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_delete_terms( $store ) {
		$taxonomy = 'test_shadow_taxonomy_term';

		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = self::$factory->term( 22,
			array(
				'name' => 'Female',
				'slug' => 'female',
				'term_taxonomy_id' => 22,
				'taxonomy' => $taxonomy,
			)
		);

		$store->update_term( $term_object );

		$store->delete_term( $term_object->term_id, $taxonomy );

		$this->assertEmpty( $store->get_term( $term_object->taxonomy, $term_object->term_id ) );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_update_post_terms( $store ) {
		$taxonomy = 'test_shadow_taxonomy_term';
		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = self::$factory->term( 22,
			array(
				'name' => 'Female',
				'slug' => 'female',
				'term_taxonomy_id' => 22,
				'taxonomy' => $taxonomy,
			)
		);

		$store->update_term( $term_object );

		$post = self::$factory->post( 5 );
		$store->upsert_post( $post );
		$replica_post = $store->get_post( 5 );

		$store->update_object_terms( $replica_post->ID, $taxonomy, array( 22 ), true );

		$terms = get_the_terms( $replica_post->ID, $taxonomy );
		$replicator_terms = $store->get_the_terms(  $replica_post->ID, $taxonomy  );

		$this->assertEquals( 1, $terms[0]->count );
		$this->assertEquals( 22, $terms[0]->term_id );
		$this->assertEquals( 22, $terms[0]->term_taxonomy_id );
		$this->assertEquals( 'female', $terms[0]->slug );
		$this->assertEquals( 'Female', $terms[0]->name );
		$this->assertEquals( $terms, $replicator_terms );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_replica_delete_post_terms( $store ) {
		$this->markTestIncomplete('contains SQL');
		global $wpdb;
		$taxonomy = 'test_shadow_taxonomy_term';

		$this->ensure_synced_taxonomy( $store, $taxonomy );

		$term_object = (object) array(
			'term_id' => 22,
			'name' => 'Female',
			'slug' => 'female',
			'term_group' => 0,
			'term_taxonomy_id' => 22,
			'taxonomy' => $taxonomy,
			'description' => '',
			'parent' => 0,
			'count' => 0,
			'filter' => 'raw',
		);

		$store->update_term( $term_object );

		$post = self::$factory->post( 5 );
		$store->upsert_post( $post );
		$replica_post = $store->get_post( 5 );

		$store->update_object_terms( $replica_post->ID, $taxonomy, array( 22 ), true );

		$terms = get_the_terms( $replica_post->ID, $taxonomy );
		$this->assertEquals( 1, $terms[0]->count );

		$store->delete_object_terms( $replica_post->ID, array( 22 ) );

		$this->assertEquals( null, $wpdb->get_row( "SELECT * FROM $wpdb->term_relationships WHERE object_id = 5 ") );

		$terms = get_the_terms( $replica_post->ID, $taxonomy );
		$this->assertEquals( 0, $terms[0]->count );
	}

	public function store_provider( $name ) {
		if ( !self::$all_replicastores ) {
			// detect classes that implement iJetpack_Sync_Replicastore
			self::$all_replicastores = array();

			foreach (get_declared_classes() as $className) {
				if (in_array('iJetpack_Sync_Replicastore', class_implements($className))) {
					self::$all_replicastores[] = $className;
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
				'label' => __( $slug ),
				'rewrite' => array( 'slug' => $slug ),
				'hierarchical' => true,
			)
		);

		// fetch the taxonomy, sync it then delete it
		global $wp_taxonomies;

		$store->set_callable( 'taxonomies', array( $slug => $wp_taxonomies[ $slug ] ) );

		// unregister_taxonomy( $slug );
	}
}
