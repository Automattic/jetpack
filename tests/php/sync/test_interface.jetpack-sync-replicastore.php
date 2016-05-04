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

class WP_Test_iJetpack_Sync_Replicastore extends WP_UnitTestCase {

	/** @var JetpackSyncTestObjectFactory $factory */
	static $factory;
	static $all_replicastores;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();
		self::$factory = new JetpackSyncTestObjectFactory();
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
	function test_upsert_comment( $store ) {
		$comment = self::$factory->comment( 3, 2 );

		$store->upsert_comment( $comment );

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