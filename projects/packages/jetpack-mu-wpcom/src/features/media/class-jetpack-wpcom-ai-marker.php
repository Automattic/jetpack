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
	 * Limits the bytes of tool output to read to avoid exhausting PHP's memory on a huge manifest.
	 */
	const MAX_OUTPUT = 262144;

	/**
	 * The IPTC DigitalSourceTypes for AI or synthetic media to keep.
	 *
	 * @see https://cv.iptc.org/newscodes/digitalsourcetype/
	 */
	const SYNTHETIC_TYPES = array(
		'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia',
		'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia',
		'http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic',
	);

	/**
	 * The jetpack_bump_stats_extras group for this caller.
	 *
	 * @var string
	 */
	private $stats_group;

	/**
	 * The errors this request sent to Logstash, by blog, so a bulk job sends each one once.
	 *
	 * @var true[][]
	 */
	private static $logged = array();

	/**
	 * The tools that timed out or couldn't start in this request, so later saves don't wait on them again.
	 *
	 * @var true[]
	 */
	private static $broken_tools = array();

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
	 * @return string The type, or '' when the file has no AI type or the host has no exiftool.
	 */
	public function read( $file ) {
		// The marker is optional, so no error may stop the save.
		try {
			if ( ! jetpack_wpcom_ai_marker_tool_path( 'exiftool' ) ) {
				return '';
			}

			return preg_match( '|^https?://|', $file )
				? $this->read_from_url( $file )
				: $this->read_local( $file );
		} catch ( Throwable $e ) {
			// The class only: messages can hold file paths.
			$this->log_error( 'read-error', array( 'error' => get_class( $e ) ) );
			return '';
		}
	}

	/**
	 * Writes the source's AI type into an edited copy, unless the copy already has an AI type.
	 *
	 * @param string $source Path or URL of the source image.
	 * @param string $edited Path of the edited image.
	 */
	public function copy( $source, $edited ) {
		if ( '' !== $this->read( $edited ) ) {
			return;
		}

		$digital_source_type = $this->read( $source );
		if ( '' !== $digital_source_type ) {
			$this->write( $edited, $digital_source_type );
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
			$output = $this->run_tool( 'exiftool', 'write', array( $exiftool, '-config', '', '-m', '-q', '-overwrite_original', '-XMP-x:XMPToolkit=', '-XMP-iptcExt:DigitalSourceType=' . $digital_source_type, $filename ) );
		} catch ( Throwable $e ) {
			$this->log_error( 'write-error', array( 'error' => get_class( $e ) ) );
			return;
		}

		// run_tool() counts and logs a failed write.
		if ( null !== $output ) {
			$this->bump_stat( 'written' );
		}
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
		$output              = (string) $this->run_tool( 'exiftool', 'read', array( $exiftool, '-config', '', '-m', '-S', '-XMP-iptcExt:DigitalSourceType', '-JUMBF:JUMDLabel', $file ) );
		$digital_source_type = preg_match( '/^DigitalSourceType: (.*)$/m', $output, $match ) ? trim( $match[1] ) : '';
		if ( self::is_synthetic( $digital_source_type ) ) {
			return $digital_source_type;
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
			$this->log_error( 'download-failed', array( 'error' => $temp->get_error_code() ) );
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

		$store     = json_decode( (string) $this->run_tool( 'c2patool', 'read', array( $c2patool, '--settings', $settings, $file ) ), true );
		$manifests = (array) ( $store['manifests'] ?? array() );
		$active    = $store['active_manifest'] ?? '';
		if ( isset( $manifests[ $active ] ) ) {
			$manifests = array( $active => $manifests[ $active ] ) + $manifests;
		}

		foreach ( $manifests as $manifest ) {
			foreach ( (array) ( $manifest['assertions'] ?? array() ) as $assertion ) {
				foreach ( (array) ( $assertion['data']['actions'] ?? array() ) as $action ) {
					$digital_source_type = $action['digitalSourceType'] ?? '';
					if ( self::is_synthetic( $digital_source_type ) ) {
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
	 * @param string   $name    exiftool or c2patool, for the error log.
	 * @param string   $step    'read' or 'write', for the error log.
	 * @param string[] $command The program and its arguments.
	 * @return string|null Its output, or null when it fails, times out or prints too much.
	 */
	private function run_tool( $name, $step, array $command ) {
		if ( isset( self::$broken_tools[ $name ] ) ) {
			return null;
		}

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
		$tool    = array(
			'tool' => $name,
			'step' => $step,
		);
		if ( ! is_resource( $process ) ) {
			self::$broken_tools[ $name ] = true;
			$this->log_error( 'could-not-start', $tool );
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

		if ( $status['running'] ) {
			self::stop( $process );
		}
		fclose( $pipes[1] ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- A process pipe, not a file.
		proc_close( $process );

		// proc_close() returns -1 once proc_get_status() has seen the exit.
		if ( $too_big ) {
			$this->log_error( 'output-too-large', $tool );
		} elseif ( $status['running'] ) {
			self::$broken_tools[ $name ] = true;
			$this->log_error( 'timed-out', $tool );
		} elseif ( 127 === $status['exitcode'] ) {
			// Older PHP on Linux starts the child even when the program is missing, and it exits 127.
			self::$broken_tools[ $name ] = true;
			$this->log_error( 'could-not-start', $tool );
		} elseif ( 0 !== $status['exitcode'] ) {
			$this->log_error( 'tool-failed', $tool + array( 'exit_code' => $status['exitcode'] ) );
		} else {
			return $output;
		}

		return null;
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
	 * Whether a type is in SYNTHETIC_TYPES.
	 *
	 * @param mixed $digital_source_type The type a tool reported.
	 * @return bool
	 */
	private static function is_synthetic( $digital_source_type ) {
		return in_array( $digital_source_type, self::SYNTHETIC_TYPES, true );
	}

	/**
	 * Counts an error, and sends it to Logstash: stats don't reach Atomic.
	 *
	 * @param string $message The error, also used as the stat.
	 * @param array  $extra   Details for the Logstash entry.
	 */
	private function log_error( $message, array $extra = array() ) {
		// read() and write() call this from their catch blocks, so it must not throw.
		try {
			$this->bump_stat( $message );

			$blog_id = get_current_blog_id();
			if ( isset( self::$logged[ $blog_id ][ $message ] ) ) {
				return;
			}
			self::$logged[ $blog_id ][ $message ] = true;

			$extra = array( 'group' => $this->stats_group ) + $extra;
			/**
			 * Filters whether to send an AI marker error to Logstash.
			 *
			 * @since $$next-version$$
			 *
			 * @param bool   $enabled Whether to send the entry. Default true.
			 * @param string $message The error.
			 * @param array  $extra   The entry's details.
			 */
			if ( apply_filters( 'jetpack_wpcom_ai_marker_log_enabled', true, $message, $extra ) ) {
				// The endpoint Atomic posts to only accepts features with an "atomic" prefix.
				\Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash( 'atomic_image_ai_marker', $message, $extra );
			}
		} catch ( Throwable $e ) {
			unset( $e );
		}
	}

	/**
	 * Bumps a stat in this caller's group.
	 *
	 * @param string $value The stat.
	 */
	private function bump_stat( $value ) {
		// The marker is optional, so a stats hook mustn't stop the save.
		try {
			do_action( 'jetpack_bump_stats_extras', $this->stats_group, $value );
		} catch ( Throwable $e ) {
			unset( $e );
		}
	}
}
