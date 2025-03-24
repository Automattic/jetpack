<?php // phpcs:ignore Squiz.Commenting
// phpcs:disable WordPress.DB

if ( ! file_exists( __DIR__ . '/wp-config.php' ) ) {
	echo 'This script needs a WordPress config file for database configuration to work.' . PHP_EOL;
	echo 'You can copy your WordPress configuration part where it defines database connection and table prefix.' . PHP_EOL;
	echo 'Put them in a wp-config.php file in this folder, just don\'t forget to remove it when you\'re done.' . PHP_EOL;
	exit( 1 );
}

require_once __DIR__ . '/wp-config.php';

$data  = get_coverage_data();
$table = $table_prefix . 'jetpack_test_coverage_data'; // phpcs:ignore VariableAnalysis -- required from wp-config.php

mysqli_report( MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT );
$dbh = new mysqli( DB_HOST, DB_USER, DB_PASSWORD, DB_NAME );

$create_table = sprintf(
	'CREATE TABLE IF NOT EXISTS `%s` (
 id int NOT NULL AUTO_INCREMENT,
 path varchar(255),
 line int,
 PRIMARY KEY (id),
 UNIQUE KEY `unique_path` (path, line)
 )',
	$table
);

$dbh->query( $create_table );

$sql = sprintf( 'INSERT IGNORE INTO `%s` (path, line) VALUES ', $table );

foreach ( $data as $file ) {
	$sql .= sprintf( "( '%s', %d ),", $file['file'], $file['lines'] );
}

$dbh->query( rtrim( $sql, ',' ) ); // phpcs:ignore WordPress.DB -- We are preparing the query before this.

$dbh->close();

/**
 * Returns an unserialized coverage object.
 *
 * @return Array coverage data
 */
function get_coverage_data() {

	$coverage = array();

	try {
		$file = new SplFileObject( 'summary.tsv' );
	} catch ( LogicException $exception ) {
		die( 'SplFileObject : ' . $exception->getMessage() ); // phpcs:ignore WordPress.Security
	}

	while ( $file->valid() ) {
		$line = $file->fgets();

		list( $filename, $executable, $executed ) = explode( "\t", $line ); // phpcs:ignore VariableAnalysis

		if ( str_starts_with( $filename, 'projects/js-packages' ) ) {
			continue;
		}

		if (
			str_starts_with( $filename, 'projects/packages' )
		) {
			$filename = 'jetpack-' . substr( $filename, strlen( 'projects/packages/' ) );
		}

		if ( str_starts_with( $filename, 'projects/plugins/jetpack/' ) ) {
			$filename = substr( $filename, strlen( 'projects/plugins/' ) );
		} elseif ( str_starts_with( $filename, 'projects/plugins' ) ) {
			$filename = 'jetpack-' . substr( $filename, strlen( 'projects/plugins/' ) );
		}

		$coverage[] = array(
			'file'  => $filename,
			'lines' => $executed,
		);
	}

	$file = null;
	return $coverage;
}
