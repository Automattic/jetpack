<?php
/**
 * SQL Generator Test file.
 *
 * @package wpcomsh
 */

use Imports\SQL_Generator;

/**
 * Class SQLGeneratorTest.
 */
class SQLGeneratorTest extends WP_UnitTestCase {

	/**
	 * The SQL Generator instance.
	 *
	 * @var SQL_Generator
	 */
	public ?SQL_Generator $generator;

	/**
	 * Setup values for each test.
	 */
	public function setUp(): void {
		parent::setup();

		$this->generator = new SQL_Generator();
	}

	/**
	 * Clear values for each test.
	 *
	 * @return void
	 */
	public function tearDown(): void {
		if ( $this->generator ) {
			unset( $this->generator );
		}

		parent::tearDown();
	}

	/**
	 * Test empty dump and current table.
	 */
	public function test_empty_dump_and_current_table() {
		$this->assertSame( '', $this->generator->get_dump() );
		$this->assertNull( $this->generator->get_current_table() );
	}

	/**
	 * Test correct line count.
	 */
	public function test_correct_line_count() {
		$this->generator->comment( 'This is a comment' );
		$this->generator->nl();
		$this->generator->output( 'This is a query' );
		$this->generator->header( 'This is an header' );

		$this->assertSame( 8, $this->get_dump_count() );
	}

	/**
	 * Test error end before starting.
	 */
	public function test_error_end_before_not_starting() {
		$this->generator->end();

		$this->assertSame( '', $this->generator->get_dump() );
	}

	/**
	 * Test error start inserting without table.
	 */
	public function test_error_start_insert_without_table() {
		$this->generator->start_table_inserts();

		$this->assertSame( '', $this->generator->get_dump() );
	}

	/**
	 * Test error inserting without table.
	 */
	public function test_error_start_table_insert_without_table() {
		$this->generator->table_insert( '', '' );

		$this->assertSame( '', $this->generator->get_dump() );
	}

	/**
	 * Test error end inserting without table.
	 */
	public function test_error_end_table_without_table() {
		$this->generator->end_table_inserts();

		$this->assertSame( '', $this->generator->get_dump() );
	}

	/**
	 * Test error get column.
	 */
	public function test_error_get_column() {
		$this->assertSame( '', $this->generator->get_column( '', array() ) );
		$this->assertSame( '', $this->generator->get_column( 'test', array() ) );
		$this->assertSame( '', $this->generator->get_column( 'test', array( 'type' => 'text' ) ) );
		$this->assertSame( '', $this->generator->get_column( 'test', array( 'sqlite_type' => 'text' ) ) );
	}

	/**
	 * Test success get column minimal.
	 */
	public function test_success_get_column_minimal() {
		$column = array(
			'type'        => 'text',
			'sqlite_type' => 'text',
		);

		$this->assertTrue( strlen( $this->generator->get_column( 'test', $column ) ) > 0 );
	}

	/**
	 * Test success get column.
	 */
	public function test_success_get_column() {
		$column = array(
			'type'           => 'text',
			'sqlite_type'    => 'text',
			'not_null'       => true,
			'auto_increment' => true,
			'default'        => '',
		);

		$this->generator->start( array( 'collation' => SQL_Generator::DEFAULT_COLLATION ) );
		$generated = $this->generator->get_column( 'test_column', $column );

		$this->assertStringContainsString( 'test_column', $generated );
		$this->assertStringContainsString( 'text', $generated );
		$this->assertStringContainsString( 'NOT NULL', $generated );
		$this->assertStringContainsString( 'AUTO_INCREMENT', $generated );
		$this->assertStringContainsString( 'DEFAULT', $generated );
		$this->assertStringContainsString( 'COLLATE', $generated );

		$column['type'] = 'datetime';
		$generated      = $this->generator->get_column( 'test_column', $column );
		$this->assertStringNotContainsString( 'COLLATE', $generated );

		$this->generator->start();
		$generated = $this->generator->get_column( 'test_column', $column );

		$this->assertStringNotContainsString( 'COLLATE', $generated );
	}

	/**
	 * Test transaction mode.
	 */
	public function test_success_enable_transaction_mode() {
		$this->generator->start();
		$this->generator->end();
		$this->assertStringContainsString( 'START TRANSACTION;', $this->generator->get_dump() );
		$this->assertStringContainsString( 'COMMIT;', $this->generator->get_dump() );

		$this->generator->start( array( 'transaction' => false ) );
		$this->generator->end();
		$this->assertStringNotContainsString( 'START TRANSACTION', $this->generator->get_dump() );
		$this->assertStringNotContainsString( 'COMMIT;', $this->generator->get_dump() );
	}

	/**
	 * Test table creation.
	 */
	public function test_table_creation() {
		$this->generator->start();
		$this->generator->start_table( 'test_table', array(), 1, false );
		$this->generator->end_table_inserts();
		$this->generator->end();

		$this->assertStringContainsString( 'CREATE TABLE `test_table`', $this->generator->get_dump() );
		$this->assertStringNotContainsString( 'DROP TABLE IF EXISTS `test_table`;', $this->generator->get_dump() );
	}

	/**
	 * Test table creation and drop.
	 */
	public function test_table_creation_and_drop() {
		$this->generator->start();
		$this->generator->start_table( 'test_table', array(), 1 );
		$this->generator->end_table_inserts();
		$this->generator->end();

		$this->assertStringContainsString( 'CREATE TABLE `test_table`', $this->generator->get_dump() );
		$this->assertStringContainsString( 'DROP TABLE IF EXISTS `test_table`;', $this->generator->get_dump() );
	}

	/**
	 * Test table creation with collation.
	 */
	public function test_table_creation_with_collation() {
		$this->generator->start( array( 'collation' => SQL_Generator::DEFAULT_COLLATION ) );
		$this->generator->start_table( 'test_table', array(), 1 );
		$this->generator->end_table_inserts();
		$this->generator->end();

		$this->assertStringContainsString( 'COLLATE=' . SQL_Generator::DEFAULT_COLLATION, $this->generator->get_dump() );
	}

	/**
	 * Test valid index names.
	 */
	public function test_valid_index_name() {
		$this->assertSame( '', SQL_Generator::get_index_name( '' ) );
		$this->assertSame( '', SQL_Generator::get_index_name( 'abc' ) );
		$this->assertSame( '', SQL_Generator::get_index_name( 'abcd' ) );
		$this->assertSame( '', SQL_Generator::get_index_name( 'abcdefgh' ) );
		$this->assertSame( '', SQL_Generator::get_index_name( 'abc__' ) );
		$this->assertSame( 'def', SQL_Generator::get_index_name( 'abc__def' ) );
	}

	/**
	 * Test default charset.
	 */
	public function test_valid_default_charset() {
		$this->generator->start();
		$this->generator->start_table( 'test_table', array(), 1 );
		$this->generator->end_table_inserts();
		$this->generator->end();

		$this->assertStringContainsString( 'SET NAMES ' . SQL_Generator::DEFAULT_CHARSET, $this->generator->get_dump() );
		$this->assertStringContainsString( 'CHARSET=' . SQL_Generator::DEFAULT_CHARSET, $this->generator->get_dump() );
	}

	/**
	 * Test charset.
	 */
	public function test_valid_specified_charset() {
		$this->generator->start( array( 'charset' => 'utf32' ) );
		$this->generator->start_table( 'test_table', array(), 1 );
		$this->generator->end_table_inserts();
		$this->generator->end();

		$this->assertStringContainsString( 'SET NAMES utf32', $this->generator->get_dump() );
		$this->assertStringContainsString( 'CHARSET=utf32', $this->generator->get_dump() );
	}

	/**
	 * Return the number of lines in the dump.
	 */
	private function get_dump_count() {
		return count( explode( "\n", $this->generator->get_dump() ) );
	}
}
