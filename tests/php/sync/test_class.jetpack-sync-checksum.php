<?php
/**
 * Integration Tests for Table Checksum functionality.
 *
 * @package automattic/jetpack-sync
 */

use Automattic\Jetpack\Sync\Replicastore\Table_Checksum;
use Automattic\Jetpack\Sync\Settings;

/**
 * Testing Table Checksum
 *
 * @group jetpack-sync
 */
class WP_Test_Jetpack_Sync_Checksum extends WP_UnitTestCase {

	/**
	 * @var array Table Configurations
	 */
	protected $allowed_tables = array();

	/**
	 * Array of Table Names and if valid.
	 *
	 * @return int[][]
	 */
	public function table_provider()
	{
		return [
			['posts', true],
			['comments', true],
			['postmeta', true],
			['commentmeta', true],
			['terms', true],
			['termmeta', true],
			['term_relationships', true],
			['term_taxonomy', true],
			['not_a_table', false],
			['comment_meta', false],
			['post_meta', false],
		];
	}

	/**
	 * Test table names are validated.
	 *
	 * @dataProvider table_provider
	 *
	 * @param string $table Table name.
	 * @param boolean $is_valid Is it a valid table name.
	 */
	public function test_checksum_validate_table_name( $table, $is_valid ) {
		if( ! $is_valid ) {
			// Exception expected if not a valid table name.
			$this->expectException(Exception::class);
		} else {
			// Valid Tables do not need any assertion.
			$this->expectNotToPerformAssertions();
		}

		$tc = new Table_Checksum( $table );
	}

	/**
	 * Array of Table Configurations with different field names
	 *
	 * @return int[][]
	 */
	public function field_validation_provider() {
		global $wpdb;

		return array(
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					)
				),
				true,
				null,
			),
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID!',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					),
				),
				false,
				'ID!',
			),
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt*/' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					)
				),
				false,
				'post_modified_gmt*/'
			),
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID/*' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					)
				),
				false,
				'ID/*'
			),
		);
	}

	/**
	 * returns the allowed_tables Table Configurations.
	 *
	 * @param array $tables Table Configurations.
	 *
	 * @return array Table Configurations.
	 */
	public function set_allowed_tables( $tables ) {
		return $this->allowed_tables;
	}

	/**
	 * Verify invalid field names throw exceptions.
	 *
	 * @dataProvider field_validation_provider
	 *
	 * @param array $table_configurations Table Configuration to overide defaults.
	 * @param boolean $is_valid  Is this a valid field name?
	 * @param string $field Field under test
	 */
	public function test_checksum_validate_fields( $table_configurations, $is_valid, $field ) {

		$this->allowed_tables = $table_configurations;
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'set_allowed_tables') );

		$user_id = $this->factory->user->create();

		// create a post
		$post_id    = $this->factory->post->create( array( 'post_author' => $user_id ) );
		$this->post = get_post( $post_id );

		$tc = new Table_Checksum( 'posts' );
		$result = $tc->calculate_checksum();

		if( ! $is_valid ) {
			$this->assertTrue( is_wp_error( $result ) );
			$expected_message = "Invalid field name: $field is not allowed";
			$this->assertSame( $result->get_error_message(), $expected_message );
		} else {
			$this->assertFalse( is_wp_error( $result ) );
		}

	}

	/**
	 * Array of Table Configurations with non-existent field names.
	 *
	 * @return int[][]
	 */
	public function field_table_validation_provider() {
		global $wpdb;

		return array(
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					)
				),
				true,
				null,
			),
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID_2',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					),
				),
				false,
				'ID_2',
			),
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID' ),
						'checksum_fields' => array( 'post_modified_gmt_2' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					)
				),
				false,
				'post_modified_gmt_2'
			),
			array (
				array(
					'posts' => array(
						'table'           => $wpdb->posts,
						'range_field'     => 'ID',
						'key_fields'      => array( 'ID_2' ),
						'checksum_fields' => array( 'post_modified_gmt' ),
						'filter_sql'      => Settings::get_blacklisted_post_types_sql(),
					)
				),
				false,
				'ID_2'
			),
		);
	}

	/**
	 * Verify field names that are not in the table throw exceptions.
	 *
	 * @dataProvider field_table_validation_provider
	 *
	 * @param array $table_configurations Table Configuration to overide defaults.
	 * @param boolean $is_valid Is this a valid field name?
	 * @param string $field Field under test
	 */
	public function test_checksum_validate_fields_against_table( $table_configurations, $is_valid, $field ) {
		global $wpdb;

		$this->allowed_tables = $table_configurations;
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'set_allowed_tables') );

		$user_id = $this->factory->user->create();

		// create a post, needed to allow for field checks.
		$post_id    = $this->factory->post->create( array( 'post_author' => $user_id ) );
		$this->post = get_post( $post_id );

		$tc = new Table_Checksum( 'posts' );
		$result = $tc->calculate_checksum();

		if( ! $is_valid ) {
			$this->assertTrue( is_wp_error( $result ) );
			$expected_message = "Invalid field name: field '{$field}' doesn't exist in table {$wpdb->posts}";
			$this->assertSame( $result->get_error_message(), $expected_message );
		} else {
			$this->assertFalse( is_wp_error( $result ) );
		}

	}

}
