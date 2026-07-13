<?php
/**
 * Tests for the CSV export Report_Csv_Generator.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use RuntimeException;

require_once __DIR__ . '/fixtures/class-failing-csv-stream-wrapper.php';
require_once __DIR__ . '/fixtures/class-spy-logger.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Report_Csv_Generator
 */
#[CoversClass( Report_Csv_Generator::class )]
class ReportCSVGenerator_Test extends TestCase {

	/**
	 * Generated file paths to clean up after each test.
	 *
	 * @var string[]
	 */
	private $created = array();

	/**
	 * Writable uploads base directory the CSV generator writes into.
	 *
	 * @var string
	 */
	private $upload_base = '';

	/**
	 * Point wp_upload_dir() at a writable temp directory (WorDBless has no real uploads dir).
	 *
	 * @before
	 */
	#[Before]
	public function set_upload_dir() {
		$this->upload_base = trailingslashit( sys_get_temp_dir() ) . 'pa-csv-export-test';
		wp_mkdir_p( $this->upload_base );
		add_filter( 'upload_dir', array( $this, 'filter_upload_dir' ) );
	}

	/**
	 * Filter callback returning the temp uploads directory.
	 *
	 * @param array $dirs Upload dir data.
	 * @return array
	 */
	public function filter_upload_dir( array $dirs ): array {
		$dirs['basedir'] = $this->upload_base;
		$dirs['baseurl'] = 'http://example.org/uploads';
		$dirs['path']    = $this->upload_base;
		$dirs['url']     = 'http://example.org/uploads';
		$dirs['error']   = false;
		return $dirs;
	}

	/**
	 * Column definitions used across tests.
	 *
	 * @var array<string, string>
	 */
	private const COLUMNS = array(
		'time_interval' => 'Date',
		'orders_no'     => 'Orders',
	);

	/**
	 * Identity-ish formatter mapping raw rows to the column keys.
	 *
	 * @return callable
	 */
	private function formatter(): callable {
		return static function ( array $row ) {
			return array(
				'time_interval' => $row['time_interval'] ?? '',
				'orders_no'     => $row['orders_no'] ?? '',
			);
		};
	}

	private function generator(): Report_Csv_Generator {
		return new Report_Csv_Generator( new Spy_Logger() );
	}

	/**
	 * Invoke a private method on the generator.
	 *
	 * @param Report_Csv_Generator $generator Generator under test.
	 * @param string               $method    Method name.
	 * @param array                $args      Arguments.
	 * @return mixed
	 */
	private function invoke_generator_method( Report_Csv_Generator $generator, string $method, array $args ) {
		$ref = new ReflectionMethod( Report_Csv_Generator::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		return $ref->invokeArgs( $generator, $args );
	}

	/**
	 * @after
	 */
	#[After]
	public function cleanup() {
		foreach ( $this->created as $path ) {
			if ( file_exists( $path ) ) {
				wp_delete_file( $path );
			}
		}
		$this->created = array();
		remove_filter( 'upload_dir', array( $this, 'filter_upload_dir' ) );
	}

	public function test_generate_writes_bom_header_and_rows() {
		$logger    = new Spy_Logger();
		$generator = new Report_Csv_Generator( $logger );

		$data = array(
			'data' => array(
				array(
					'time_interval' => '2026-01-01',
					'orders_no'     => 5,
				),
				array(
					'time_interval' => '2026-01-02',
					'orders_no'     => 8,
				),
			),
		);

		$path = $generator->generate( $data, self::COLUMNS, $this->formatter(), 'unit-test-report' );
		$this->assertIsString( $path );
		$this->created[] = $path;
		$this->assertFileExists( $path );

		$contents = file_get_contents( $path );
		$this->assertStringStartsWith( "\xEF\xBB\xBF", $contents, 'CSV should start with a UTF-8 BOM.' );

		$lines = array_values( array_filter( explode( "\n", trim( $contents ) ) ) );
		$this->assertStringContainsString( 'Date,Orders', $lines[0] );
		$this->assertStringContainsString( '2026-01-01,5', $lines[1] );
		$this->assertStringContainsString( '2026-01-02,8', $lines[2] );

		// A success message is logged.
		$messages = array_column( $logger->entries, 'level' );
		$this->assertContains( 'message', $messages );
	}

	public function test_generate_skips_rows_the_formatter_drops() {
		$generator = $this->generator();

		$data = array(
			'data' => array(
				array(
					'time_interval' => '2026-01-01',
					'orders_no'     => 5,
				),
				array( 'skip' => true ),
			),
		);

		// Formatter returns an empty array for rows without orders data, which must be skipped.
		$formatter = static function ( array $row ) {
			return isset( $row['orders_no'] )
				? array(
					'time_interval' => $row['time_interval'],
					'orders_no'     => $row['orders_no'],
				)
				: array();
		};

		$path            = $generator->generate( $data, self::COLUMNS, $formatter, 'unit-test-skip' );
		$this->created[] = $path;

		$rows = array_values( array_filter( explode( "\n", trim( file_get_contents( $path ) ) ) ) );
		// Header + one data row only (the empty-formatted row is skipped).
		$this->assertCount( 2, $rows );
	}

	public function test_generate_defaults_the_filename_when_omitted() {
		$generator = $this->generator();
		$path      = $generator->generate( array( 'data' => array() ), self::COLUMNS, $this->formatter() );
		$this->assertIsString( $path );
		$this->created[] = $path;
		$this->assertStringContainsString( 'report-export-', basename( $path ) );
	}

	public function test_delete_file() {
		$generator = $this->generator();
		$path      = $generator->generate( array( 'data' => array() ), self::COLUMNS, $this->formatter(), 'unit-test-delete' );

		$this->assertTrue( $generator->delete_file( $path ) );
		$this->assertFalse( file_exists( $path ) );
		// Deleting a missing file returns false.
		$this->assertFalse( $generator->delete_file( $path ) );
	}

	public function test_stream_file_returns_false_for_missing_file() {
		$generator = $this->generator();
		$this->assertFalse( $generator->stream_file( '/does/not/exist.csv' ) );
	}

	public function test_write_helpers_throw_when_stream_writes_fail() {
		$scheme     = 'pa-failing-csv';
		$registered = false;

		if ( ! in_array( $scheme, stream_get_wrappers(), true ) ) {
			$registered = stream_wrapper_register( $scheme, Failing_Csv_Stream_Wrapper::class );
			$this->assertTrue( $registered );
		}

		$handle = fopen( $scheme . '://output', 'w' );

		try {
			$generator = $this->generator();

			try {
				$this->invoke_generator_method( $generator, 'write_bom', array( $handle ) );
				$this->fail( 'Expected write_bom() to throw when the stream writes zero bytes.' );
			} catch ( RuntimeException $e ) {
				$this->assertSame( 'Failed to write CSV BOM.', $e->getMessage() );
			}

			try {
				$this->invoke_generator_method( $generator, 'write_csv_row', array( $handle, array( 'Date', 'Orders' ) ) );
				$this->fail( 'Expected write_csv_row() to throw when the stream writes zero bytes.' );
			} catch ( RuntimeException $e ) {
				$this->assertSame( 'Failed to write CSV row.', $e->getMessage() );
			}
		} finally {
			if ( is_resource( $handle ) ) {
				fclose( $handle );
			}

			if ( $registered ) {
				stream_wrapper_unregister( $scheme );
			}
		}
	}

	/**
	 * Values that begin with a formula trigger character must be neutralized with a leading quote.
	 *
	 * @dataProvider formula_injection_provider
	 * @param string $dangerous The raw cell value.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'formula_injection_provider' )]
	public function test_generate_neutralizes_formula_injection( string $dangerous ) {
		$generator = $this->generator();

		$columns   = array(
			'time_interval' => 'Date',
			'orders_no'     => 'Orders',
		);
		$formatter = static function ( array $row ) {
			return array(
				'time_interval' => $row['time_interval'] ?? '',
				'orders_no'     => $row['orders_no'] ?? '',
			);
		};
		$data      = array(
			'data' => array(
				array(
					'time_interval' => $dangerous,
					'orders_no'     => 1,
				),
			),
		);

		$path            = $generator->generate( $data, $columns, $formatter, 'unit-test-injection' );
		$this->created[] = $path;

		$lines = array_values( array_filter( explode( "\n", trim( substr( file_get_contents( $path ), 3 ) ) ) ) );
		// Data row is index 1 (0 is the header). The dangerous value is prefixed with a single quote.
		$data_row = str_getcsv( $lines[1], ',', '"', '\\' );
		$this->assertSame( "'" . $dangerous, $data_row[0] );
	}

	/**
	 * Formula-injection trigger characters.
	 *
	 * @return array<string, array{0:string}>
	 */
	public static function formula_injection_provider(): array {
		return array(
			'equals'   => array( '=HYPERLINK("http://evil","x")' ),
			'plus'     => array( '+1+1' ),
			'minus'    => array( '-2+3' ),
			'at'       => array( '@SUM(A1:A9)' ),
			'tab'      => array( "\tcmd" ),
			'carriage' => array( "\rcmd" ),
		);
	}
}
