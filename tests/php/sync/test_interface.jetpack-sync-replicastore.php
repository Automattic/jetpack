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
	 */
	function test_all_checksums_match() {
		$post = self::$factory->post( 5 );
		$comment = self::$factory->comment( 3, $post->ID );

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
		}

		// ensure the checksums are the same
		$checksums = array_map( array( $this, 'get_all_checksums' ), $all_replicastores );

		$labelled_checksums = array_combine( array_map( 'get_class', $all_replicastores ), $checksums );

		// find unique checksums - if all checksums are the same, there should be only one element
		$unique_checksums_count = count( array_unique( array_map( 'serialize', $checksums ) ) );

		$this->assertEquals( 1, $unique_checksums_count, "Checksums not unique: ".print_r( $labelled_checksums, 1 ) );
	}

	function get_all_checksums( $replicastore ) {
		return $replicastore->checksum_all();
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_upsert_post( $store ) {
		$post = self::$factory->post( 5 );

		$store->upsert_post( $post );

		$this->assertEquals( $post, $store->get_post( $post->ID ) );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_checksum_posts( $store ) {
		$before_checksum = $store->posts_checksum();

		$post = self::$factory->post( 5 );

		$store->upsert_post( $post );

		$this->assertNotEquals( $before_checksum, $store->posts_checksum() );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_doesnt_checksum_post_revisions( $store ) {
		// just add some data
		$store->upsert_post( self::$factory->post( 5 ) );

		$before_checksum = $store->posts_checksum();

		$store->upsert_post( self::$factory->post( 6, array( 'post_type' => 'revision' ) ) );

		$this->assertEquals( $before_checksum, $store->posts_checksum() );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_upsert_comment( $store ) {
		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );
		$this->assertEquals( $comment, $store->get_comment( $comment->comment_ID ) );
	}

	/**
	 * @dataProvider store_provider
	 * @requires PHP 5.3
	 */
	function test_checksum_comments( $store ) {
		$before_checksum = $store->comments_checksum();

		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );

		$this->assertNotEquals( $before_checksum, $store->comments_checksum() );
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
}