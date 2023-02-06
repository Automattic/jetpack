<?php
namespace Automattic\Jetpack\Analyzer;

class Scripts {
	static function get_differences( $new_path, $old_path ) {
		$excludes = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );

		$new_out_path             = dirname( __DIR__ ) . '/output/differences/new_target.json';
		$old_out_path             = dirname( __DIR__ ) . '/output/differences/old_target.json';
		$diff_path                = dirname( __DIR__ ) . '/output/differences/diff.json';
		$jetpack_new_declarations = new Declarations();
		$jetpack_old_declarations = new Declarations();
		$differences              = new Differences();

		echo "Scanning new declarations\n";
		if ( file_exists( $new_out_path ) ) {
			$jetpack_new_declarations->load( $new_out_path );
		} else {
			$jetpack_new_declarations->scan( $new_path, $excludes );
			$jetpack_new_declarations->save_json( $new_out_path, false );
		}

		echo "Scanning old declarations\n";
		if ( file_exists( $old_out_path ) ) {
			$jetpack_old_declarations->load( $old_out_path );
		} else {
			$jetpack_old_declarations->scan( $old_path, $excludes );
			$jetpack_old_declarations->save_json( $old_out_path, false );
		}

		echo "Looking for differences\n";
		if ( file_exists( $diff_path ) ) {
			$differences->load( $diff_path );
		} else {
			$differences->find( $jetpack_new_declarations, $jetpack_old_declarations, $new_path );
			$differences->save_json( $diff_path, false );
		}

		return $differences;
	}

	static function load_differences() {
		$diff_path                = dirname( __DIR__ ) . '/output/differences/diff.json';
		$differences              = new Differences();

		if ( !file_exists( $diff_path ) ) {
			throw new \Exception('Failed to load differences. File does not exist: ' . $diff_path);
		}
		$differences->load( $diff_path );
		return $differences;
	}

	static function get_warnings( $folder_name, $differences, $excludes ) {
		$warnings_folder = dirname( __DIR__ ) . '/output/warnings/';
		$invocations_folder = dirname( __DIR__ ) . '/output/invocations/';

		echo "Looking for invocations in:\n${folder_name}\n\n";
		$invocations = new Invocations();
		$invocations->scan( $folder_name, $excludes );
		$invocations->save( $invocations_folder . basename( $folder_name ) . '.json', false );

		echo "Generate warnings\n";
		$warnings = new Warnings();
		$warnings->generate( $invocations, $differences );
		$warnings->output();
		$warnings->save_json( $warnings_folder . basename( $folder_name ) . '.json', false );
	}

	static function cleanup() {
		$diff_folder = dirname( __DIR__ ) . '/output/differences/';
		$warnings_folder = dirname( __DIR__ ) . '/output/warnings/';
		$invocations_folder = dirname( __DIR__ ) . '/output/invocations/';
		echo "Removing " . $diff_folder . "\n";
		self::rm($diff_folder);

		echo "Removing " . $invocations_folder . "\n";
		self::rm($invocations_folder);

		echo "Removing " . $warnings_folder . "\n";
		self::rm($warnings_folder);
	}

	static function rm($folder) {
		$iter = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( escapeshellarg( $folder ), \FilesystemIterator::CURRENT_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS ),
			\RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iter as $path ) {
			if ( is_dir( $path ) ) {
				rmdir( $path );
			} else {
				unlink( $path );
			}
		}
	}
}

class Locker {
	public static $__lock_file = 'jp-analyzer.pid';

	static function lock() {
		$fp = @fopen( self::lock_file(), 'x' );
		if ( ! $fp ) {
			throw new \Exception( 'Locked already' );
		}
		fwrite( $fp, (string) getmypid() );
		fclose( $fp );
	}
	static function unlock() {
		if ( self::is_locked() ) {
			 unlink( self::lock_file() );
		} else {
			throw new \Exception( 'Not locked' );
		}
	}
	static function is_locked() {
		return file_exists( self::lock_file() );
	}

	static function lock_file() {
		return '/tmp/' . self::$__lock_file;
	}

}
