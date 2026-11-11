<?php
/**
 * Reads and writes an image's AI marker with exiftool and c2patool.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Reads an AI IPTC DigitalSourceType from XMP or C2PA, and writes it to XMP.
 */
class Jetpack_WPCOM_AI_Marker {

	/**
	 * Most bytes of tool output to read.
	 */
	const MAX_OUTPUT = 262144;

	/**
	 * The jetpack_bump_stats_extras group for this caller.
	 *
	 * @var string
	 */
	private $stats_group;

	/**
	 * Sets the stats group.
	 *
	 * @param string $stats_group The jetpack_bump_stats_extras group for this caller.
	 */
	public function __construct( $stats_group ) {
		$this->stats_group = $stats_group;
	}

	/**
	 * Reads the AI DigitalSourceType from a path or a URL.
	 *
	 * @param string $file Path or URL of the source image.
	 * @return string The type, or '' when the file has no AI type.
	 */
	public function read( $file ) {
		// The marker is optional, so no error may stop the save.
		try {
			return preg_match( '|^https?://|', $file )
				? $this->read_from_url( $file )
				: $this->read_local( $file );
		} catch ( Throwable $e ) {
			$this->bump_stat( 'read-error' );
			return '';
		}
	}

	/**
	 * Writes the type with exiftool.
	 *
	 * @param string $filename            Path of the image.
	 * @param string $digital_source_type The type to write.
	 */
	public function write( $filename, $digital_source_type ) {
		try {
			$exiftool = jetpack_wpcom_ai_marker_tool_path( 'exiftool' );
			// Stops exiftool recording its version.
			$output = $this->run_tool( array( $exiftool, '-config', '', '-m', '-q', '-overwrite_original', '-XMP-x:XMPToolkit=', '-XMP-iptcExt:DigitalSourceType=' . $digital_source_type, $filename ) );
		} catch ( Throwable $e ) {
			$output = null;
		}

		$this->bump_stat( null !== $output ? 'written' : 'write-failed' );
	}

	/**
	 * Reads the AI DigitalSourceType from XMP, then from C2PA when the file has a manifest.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when the file has no AI type.
	 */
	private function read_local( $file ) {
		$exiftool = jetpack_wpcom_ai_marker_tool_path( 'exiftool' );
		// No config file: exiftool runs it as Perl.
		$output = (string) $this->run_tool( array( $exiftool, '-config', '', '-m', '-S', '-XMP-iptcExt:DigitalSourceType', '-JUMBF:JUMDLabel', $file ) );
		if ( preg_match( '/^DigitalSourceType: (.*)$/m', $output, $match ) ) {
			$digital_source_type = trim( $match[1] );
			return self::is_ai( $digital_source_type ) ? $digital_source_type : '';
		}

		return str_contains( $output, 'JUMDLabel: ' ) ? $this->read_c2pa( $file ) : '';
	}

	/**
	 * Core loads the source by URL when the file isn't on this host.
	 *
	 * @param string $url URL of the source image.
	 * @return string The type, or '' when the file has no AI type or the download fails.
	 */
	private function read_from_url( $url ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$this->bump_stat( 'remote-source' );

		$temp = download_url( $url, 10 );
		if ( is_wp_error( $temp ) ) {
			$this->bump_stat( 'download-failed' );
			return '';
		}

		try {
			return $this->read_local( $temp );
		} finally {
			// wp_delete_file() hooks are for uploads.
			unlink( $temp ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		}
	}

	/**
	 * Reads the active manifest first: c2patool lists manifests in no fixed order.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when there is no AI type or c2patool fails.
	 */
	private function read_c2pa( $file ) {
		$c2patool = jetpack_wpcom_ai_marker_tool_path( 'c2patool' );
		$settings = __DIR__ . '/c2pa-settings.json';
		// c2patool ignores a missing settings file, then fetches remote manifests.
		if ( ! $c2patool || ! is_readable( $settings ) ) {
			return '';
		}

		$store     = json_decode( (string) $this->run_tool( array( $c2patool, '--settings', $settings, $file ) ), true );
		$manifests = (array) ( $store['manifests'] ?? array() );
		$active    = $store['active_manifest'] ?? '';
		if ( isset( $manifests[ $active ] ) ) {
			$manifests = array( $active => $manifests[ $active ] ) + $manifests;
		}

		foreach ( $manifests as $manifest ) {
			foreach ( (array) ( $manifest['assertions'] ?? array() ) as $assertion ) {
				foreach ( (array) ( $assertion['data']['actions'] ?? array() ) as $action ) {
					$digital_source_type = $action['digitalSourceType'] ?? '';
					if ( self::is_ai( $digital_source_type ) ) {
						$this->bump_stat( 'from-c2pa' );
						return $digital_source_type;
					}
				}
			}
		}

		return '';
	}

	/**
	 * Runs a tool without a shell, with a time limit: PHP's own limit ignores other programs.
	 *
	 * @param string[] $command The program and its arguments.
	 * @return string|null Its output, or null when it fails, times out or prints too much.
	 */
	private function run_tool( array $command ) {
		/**
		 * Filters how many seconds a tool may run.
		 *
		 * @since $$next-version$$
		 *
		 * @param int|float $seconds The time limit.
		 */
		$deadline = microtime( true ) + (float) apply_filters( 'jetpack_wpcom_ai_marker_tool_time_limit', 2 );

		// No stdin, so a tool can't wait for input.
		$descriptors = array(
			0 => array( 'null' ),
			1 => array( 'pipe', 'w' ),
			2 => array( 'null' ),
		);
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_proc_open
		$process = proc_open( $command, $descriptors, $pipes );
		if ( ! is_resource( $process ) ) {
			return null;
		}

		// Non-blocking, so a read can't outlast the deadline.
		stream_set_blocking( $pipes[1], false );
		$output = '';
		// Read while waiting, so a full pipe can't block the tool. The read after its exit gets the rest.
		do {
			usleep( 10000 );
			$status  = proc_get_status( $process );
			$output .= (string) stream_get_contents( $pipes[1], self::MAX_OUTPUT + 1 - strlen( $output ) );
			$too_big = strlen( $output ) > self::MAX_OUTPUT;
		} while ( $status['running'] && ! $too_big && microtime( true ) < $deadline );

		if ( $too_big ) {
			$this->bump_stat( 'output-too-large' );
		} elseif ( $status['running'] ) {
			$this->bump_stat( 'timed-out' );
		}
		if ( $status['running'] ) {
			self::stop( $process );
		}
		fclose( $pipes[1] ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- A process pipe, not a file.
		proc_close( $process );

		// proc_close() returns -1 once proc_get_status() has seen the exit.
		return ! $too_big && ! $status['running'] && 0 === $status['exitcode'] ? $output : null;
	}

	/**
	 * Sends SIGINT so exiftool deletes its temp file, then SIGKILL after 1 second.
	 *
	 * @param resource $process The tool's process.
	 */
	private static function stop( $process ) {
		proc_terminate( $process, 2 );
		$grace = microtime( true ) + 1;
		while ( microtime( true ) < $grace ) {
			usleep( 10000 );
			if ( ! proc_get_status( $process )['running'] ) {
				return;
			}
		}
		proc_terminate( $process, 9 );
	}

	/**
	 * Whether a type is an IPTC URI for AI media. A null byte would make proc_open() throw.
	 *
	 * @param mixed $digital_source_type The type a tool reported.
	 * @return bool
	 */
	private static function is_ai( $digital_source_type ) {
		return is_string( $digital_source_type )
			&& 1 === preg_match( '/^[\x21-\x7e]{1,255}$/D', $digital_source_type )
			&& false !== stripos( $digital_source_type, 'trainedAlgorithmicMedia' );
	}

	/**
	 * Bumps a stat in this caller's group.
	 *
	 * @param string $value The stat.
	 */
	private function bump_stat( $value ) {
		do_action( 'jetpack_bump_stats_extras', $this->stats_group, $value );
	}
}
