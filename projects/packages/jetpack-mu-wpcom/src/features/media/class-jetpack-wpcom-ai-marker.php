<?php
/**
 * Reads and writes an image's AI marker with exiftool and c2patool.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * The marker is the IPTC DigitalSourceType, from XMP or a C2PA manifest. It's written to XMP.
 */
class Jetpack_WPCOM_AI_Marker {

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
	 * Reads the DigitalSourceType from a path or a URL.
	 *
	 * @param string $file Path or URL of the source image.
	 * @return string The type, or '' when the file has none.
	 */
	public function read( $file ) {
		return preg_match( '|^https?://|', $file )
			? $this->read_from_url( $file )
			: $this->read_local( $file );
	}

	/**
	 * Writes the type with exiftool.
	 *
	 * @param string $filename            Path of the image.
	 * @param string $digital_source_type The type to write.
	 */
	public function write( $filename, $digital_source_type ) {
		$exiftool = jetpack_wpcom_ai_marker_tool_path( 'exiftool' );
		// The empty XMPToolkit stops exiftool from recording its version in the file.
		$output = $this->run_tool( array( $exiftool, '-m', '-q', '-overwrite_original', '-XMP-x:XMPToolkit=', '-XMP-iptcExt:DigitalSourceType=' . $digital_source_type, $filename ) );

		$this->bump_stat( null !== $output ? 'written' : 'write-failed' );
	}

	/**
	 * Reads the DigitalSourceType from XMP, then from C2PA when the file has a manifest.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when the file has none.
	 */
	private function read_local( $file ) {
		$exiftool = jetpack_wpcom_ai_marker_tool_path( 'exiftool' );
		$output   = (string) $this->run_tool( array( $exiftool, '-m', '-S', '-XMP-iptcExt:DigitalSourceType', '-JUMBF:JUMDLabel', $file ) );
		if ( preg_match( '/^DigitalSourceType: (.*)$/m', $output, $match ) ) {
			return trim( $match[1] );
		}

		return str_contains( $output, 'JUMDLabel: ' ) ? $this->read_c2pa( $file ) : '';
	}

	/**
	 * Core loads the source by URL when the file isn't on this host.
	 *
	 * @param string $url URL of the source image.
	 * @return string The type, or '' when the file has none or the download fails.
	 */
	private function read_from_url( $url ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$this->bump_stat( 'remote-source' );

		$temp = download_url( $url, 30 );
		if ( is_wp_error( $temp ) ) {
			$this->bump_stat( 'download-failed' );
			return '';
		}

		$digital_source_type = $this->read_local( $temp );
		// wp_delete_file() hooks are for uploads, not temp files.
		unlink( $temp ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink

		return $digital_source_type;
	}

	/**
	 * Reads the active manifest first: c2patool lists manifests in no fixed order.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when there is none or c2patool fails.
	 */
	private function read_c2pa( $file ) {
		$c2patool = jetpack_wpcom_ai_marker_tool_path( 'c2patool' );
		if ( ! $c2patool ) {
			return '';
		}

		$store     = json_decode( (string) $this->run_tool( array( $c2patool, '--settings', __DIR__ . '/c2pa-settings.json', $file ) ), true );
		$manifests = (array) ( $store['manifests'] ?? array() );
		$active    = $store['active_manifest'] ?? '';
		if ( isset( $manifests[ $active ] ) ) {
			$manifests = array( $active => $manifests[ $active ] ) + $manifests;
		}

		foreach ( $manifests as $manifest ) {
			foreach ( (array) ( $manifest['assertions'] ?? array() ) as $assertion ) {
				foreach ( (array) ( $assertion['data']['actions'] ?? array() ) as $action ) {
					$digital_source_type = $action['digitalSourceType'] ?? '';
					if ( is_string( $digital_source_type ) && '' !== $digital_source_type ) {
						$this->bump_stat( 'from-c2pa' );
						return $digital_source_type;
					}
				}
			}
		}

		return '';
	}

	/**
	 * Runs a tool under timeout(1), since PHP's time limit ignores time spent in other programs.
	 *
	 * @param string[] $command The program and its arguments.
	 * @return string|null Its output, or null when it fails or times out.
	 */
	private function run_tool( array $command ) {
		/**
		 * Filters how many seconds exiftool or c2patool may run on one file.
		 *
		 * @since $$next-version$$
		 *
		 * @param int|float $seconds The time limit.
		 */
		$seconds = (float) apply_filters( 'jetpack_wpcom_ai_marker_tool_time_limit', 10 );

		$args = array_map( 'escapeshellarg', array_merge( array( 'timeout', (string) $seconds ), $command ) );
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
		exec( implode( ' ', $args ) . ' 2>/dev/null', $output, $status );

		// 124: timeout(1) stopped the tool.
		if ( 124 === $status ) {
			$this->bump_stat( 'timed-out' );
		}

		return 0 === $status ? implode( "\n", $output ) : null;
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
