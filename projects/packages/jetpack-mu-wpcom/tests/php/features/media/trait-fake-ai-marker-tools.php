<?php
/**
 * Fake exiftool and c2patool scripts for the AI marker tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

trait Fake_AI_Marker_Tools {

	/**
	 * The exiftool argument that sets the type.
	 *
	 * @var string
	 */
	private static $write_arg = '-XMP-iptcExt:DigitalSourceType=';

	/**
	 * Log file for each fake tool, by tool name.
	 *
	 * @var string[]
	 */
	private $logs = array();

	/**
	 * Fakes exiftool: a read reports $type and maybe a C2PA box, a write exits with $write_status.
	 *
	 * @param string $type         The XMP type a read reports, or '' for none.
	 * @param int    $write_status Exit status of a write.
	 * @param bool   $has_c2pa     Whether a read reports a C2PA box.
	 */
	private function fake_exiftool( $type, $write_status = 0, $has_c2pa = false ) {
		$read = '' === $type ? '' : "printf 'DigitalSourceType: %s\\n' " . escapeshellarg( $type ) . '; ';
		if ( $has_c2pa ) {
			$read .= "echo 'JUMDLabel: c2pa'; ";
		}

		$this->fake_tool( 'exiftool', 'case " $* " in *" -S "*) ' . $read . "exit 0;; esac\nexit $write_status\n" );
	}

	/**
	 * Points the editor at a fake c2patool that prints $store and exits with $status.
	 *
	 * @param array $store  The manifest store to print as JSON.
	 * @param int   $status Exit status.
	 */
	private function fake_c2patool( $store, $status = 0 ) {
		$output = $this->temp_path( 'json' );
		file_put_contents( $output, wp_json_encode( $store, JSON_UNESCAPED_SLASHES ) );
		$this->fake_tool( 'c2patool', 'cat ' . escapeshellarg( $output ) . "\nexit $status\n" );
	}

	/**
	 * Makes $tool a shell script that logs its arguments, then runs $body.
	 *
	 * @param string $tool exiftool or c2patool.
	 * @param string $body The script after the logging lines.
	 */
	private function fake_tool( $tool, $body ) {
		$this->logs[ $tool ] = $this->temp_path( 'log' );
		$log                 = escapeshellarg( $this->logs[ $tool ] );
		$script              = $this->temp_path( 'sh' );
		file_put_contents( $script, "#!/bin/sh\nprintf '%s\\037' \"\$@\" >> $log\nprintf '\\036' >> $log\n" . $body );
		chmod( $script, 0755 );
		$this->use_tool( $tool, $script );
	}

	/**
	 * Points the editor at $path for $tool.
	 *
	 * @param string $tool exiftool or c2patool.
	 * @param string $path Path of the program.
	 */
	private function use_tool( $tool, $path ) {
		add_filter(
			'jetpack_wpcom_ai_marker_tool_path',
			function ( $current, $name ) use ( $tool, $path ) {
				return $tool === $name ? $path : $current;
			},
			20,
			2
		);
	}

	/**
	 * Returns the arguments of each call to the fake $tool, in order.
	 *
	 * @param string $tool exiftool or c2patool.
	 * @return string[][]
	 */
	private function calls( $tool ) {
		if ( ! file_exists( $this->logs[ $tool ] ) ) {
			return array();
		}
		$calls = array_filter( explode( "\036", file_get_contents( $this->logs[ $tool ] ) ) );

		return array_values(
			array_map(
				function ( $call ) {
					return explode( "\037", rtrim( $call, "\037" ) );
				},
				$calls
			)
		);
	}

	/**
	 * Returns the file each read asked exiftool about.
	 *
	 * @return string[]
	 */
	private function read_paths() {
		$paths = array();
		foreach ( $this->calls( 'exiftool' ) as $args ) {
			if ( in_array( '-S', $args, true ) ) {
				$paths[] = end( $args );
			}
		}

		return $paths;
	}

	/**
	 * Returns the type each write asked exiftool to set.
	 *
	 * @return string[]
	 */
	private function written_types() {
		$types = array();
		foreach ( $this->calls( 'exiftool' ) as $args ) {
			foreach ( $args as $arg ) {
				if ( str_starts_with( $arg, self::$write_arg ) ) {
					$types[] = substr( $arg, strlen( self::$write_arg ) );
				}
			}
		}

		return $types;
	}

	/**
	 * Returns a fresh path in the uploads directory.
	 *
	 * @param string $extension File extension.
	 * @return string
	 */
	private function temp_path( $extension ) {
		return wp_upload_dir()['path'] . '/ai-marker-' . wp_generate_password( 12, false ) . '.' . $extension;
	}
}
