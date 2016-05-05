<?php

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once ABSPATH . 'wp-content/mu-plugins/jetpack/sync/class.jetpack-sync-test-object-factory.php';
} else {
	// is running in jetpack
	require_once dirname( __FILE__ ) . '/server/class.jetpack-sync-test-object-factory.php';	
}

/*
 * Tests all known implementations of the replicastore
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
		$store_array = $prop->getValue( $this );
		$store = $store_array[0];
		$store->reset();
	}

	function tearDown() {
		parent::tearDown();

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			restore_current_blog();
		}
	}

	/**
	 * @dataProvider store_provider
	 */
	function test_upsert_post( $store ) {
		$post = self::$factory->post( 5 );

		$store->upsert_post( $post );

		$this->assertEquals( $post, $store->get_post( $post->ID ) );
	}

	/**
	 * @dataProvider store_provider
	 */
	function test_checksum_posts( $store ) {
		$before_checksum = $store->posts_checksum();

		$post = self::$factory->post( 5 );

		$store->upsert_post( $post );

		$this->assertNotEquals( $before_checksum, $store->posts_checksum() );
	}

	/**
	 * @dataProvider store_provider
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
	 */
	function test_upsert_comment( $store ) {
		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );
		error_log( print_r( $comment,1 ));
		error_log( print_r(  $store->get_comment( $comment->comment_ID ) ,1 )); //error_log( $store->get_comment( $comment->comment_ID ) );
		$this->assertEquals( $comment, $store->get_comment( $comment->comment_ID ) );
	}

	/**
	 * @dataProvider store_provider
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