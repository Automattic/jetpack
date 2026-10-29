<?php
/**
 * The GD image editor for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// This file can load before core's editor classes.
require_once ABSPATH . WPINC . '/class-wp-image-editor.php';
require_once ABSPATH . WPINC . '/class-wp-image-editor-gd.php';

/**
 * GD drops all metadata on save. This keeps the XMP DigitalSourceType, whatever its value.
 */
class Jetpack_WPCOM_Image_Editor_GD extends WP_Image_Editor_GD {

	/**
	 * The source's DigitalSourceType: '' when it has none, null until the first save.
	 *
	 * @var string|null
	 */
	private $digital_source_type = null;

	/**
	 * Source types by path or URL, so the edit hook reuses the editor's read.
	 *
	 * @var string[]
	 */
	private static $source_types = array();

	/**
	 * Saves the image, then writes the source's DigitalSourceType into it.
	 *
	 * @param string   $filename  Path to save the image to.
	 * @param callable $callback  GD function that writes the image.
	 * @param array    $arguments Arguments for the callback.
	 * @return bool
	 */
	protected function make_image( $filename, $callback, $arguments ) {
		if ( null === $this->digital_source_type ) {
			$this->digital_source_type = self::read_digital_source_type( $this->file );
		}

		$result = parent::make_image( $filename, $callback, $arguments );

		if ( $result && '' !== $this->digital_source_type && ! wp_is_stream( $filename ) ) {
			self::write_digital_source_type( $filename, $this->digital_source_type );
		}

		return $result;
	}

	/**
	 * Writes the source's DigitalSourceType into an edited copy that has none.
	 *
	 * @param string $source Path or URL of the source image.
	 * @param string $edited Path of the edited image.
	 * @return bool Whether the type was written.
	 */
	public static function copy_digital_source_type( $source, $edited ) {
		if ( '' !== self::read_tags( $edited )['type'] ) {
			return false;
		}

		return self::write_digital_source_type( $edited, self::read_digital_source_type( $source ) );
	}

	/**
	 * Reads the DigitalSourceType once per source.
	 *
	 * @param string $file Path or URL of the source image.
	 * @return string The type, or '' when the file has none.
	 */
	private static function read_digital_source_type( $file ) {
		if ( ! isset( self::$source_types[ $file ] ) ) {
			self::$source_types[ $file ] = preg_match( '|^https?://|', $file )
				? self::read_digital_source_type_from_url( $file )
				: self::read_local_digital_source_type( $file );
		}

		return self::$source_types[ $file ];
	}

	/**
	 * Reads the DigitalSourceType from XMP, then from C2PA when the file has a manifest.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when the file has none.
	 */
	private static function read_local_digital_source_type( $file ) {
		$tags = self::read_tags( $file );
		if ( '' !== $tags['type'] || ! $tags['has_c2pa'] ) {
			return $tags['type'];
		}

		return self::read_c2pa_digital_source_type( $file );
	}

	/**
	 * Core loads the source by URL when the file isn't on this host.
	 *
	 * @param string $url URL of the source image.
	 * @return string The type, or '' when the file has none or the download fails.
	 */
	private static function read_digital_source_type_from_url( $url ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		do_action( 'jetpack_bump_stats_extras', 'image_editor_ai_marker', 'remote-source' );

		$temp = download_url( $url, 30 );
		if ( is_wp_error( $temp ) ) {
			do_action( 'jetpack_bump_stats_extras', 'image_editor_ai_marker', 'download-failed' );
			return '';
		}

		$digital_source_type = self::read_local_digital_source_type( $temp );
		// wp_delete_file() hooks are for uploads, not temp files.
		unlink( $temp ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink

		return $digital_source_type;
	}

	/**
	 * Reads the XMP DigitalSourceType, and whether the file has a C2PA (JUMBF) box.
	 *
	 * @param string $file Path of the image.
	 * @return array{type: string, has_c2pa: bool} '' and false when exiftool is missing or fails.
	 */
	private static function read_tags( $file ) {
		$exiftool = jetpack_wpcom_ai_marker_tool_path( 'exiftool' );
		$output   = '';
		if ( $exiftool ) {
			$output = (string) self::run_tool( array( $exiftool, '-m', '-S', '-XMP-iptcExt:DigitalSourceType', '-JUMBF:JUMDLabel', $file ) );
		}

		$has_type = preg_match( '/^DigitalSourceType: (.*)$/m', $output, $match );

		return array(
			'type'     => $has_type ? trim( $match[1] ) : '',
			'has_c2pa' => str_contains( $output, 'JUMDLabel: ' ),
		);
	}

	/**
	 * Reads the active manifest first: c2patool lists manifests in no fixed order.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when there is none or c2patool fails.
	 */
	private static function read_c2pa_digital_source_type( $file ) {
		$c2patool = jetpack_wpcom_ai_marker_tool_path( 'c2patool' );
		$settings = __DIR__ . '/c2pa-settings.json';
		if ( ! $c2patool || ! is_readable( $settings ) ) {
			return '';
		}

		$store     = json_decode( (string) self::run_tool( array( $c2patool, '--settings', $settings, $file ) ), true );
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
						do_action( 'jetpack_bump_stats_extras', 'image_editor_ai_marker', 'from-c2pa' );
						return $digital_source_type;
					}
				}
			}
		}

		return '';
	}

	/**
	 * Writes the type with exiftool.
	 *
	 * @param string $filename            Path of the saved image.
	 * @param string $digital_source_type The type to write.
	 * @return bool Whether it worked.
	 */
	private static function write_digital_source_type( $filename, $digital_source_type ) {
		$exiftool = jetpack_wpcom_ai_marker_tool_path( 'exiftool' );
		if ( ! $exiftool || '' === $digital_source_type ) {
			return false;
		}

		$output  = self::run_tool( array( $exiftool, '-m', '-q', '-overwrite_original', '-XMP-iptcExt:DigitalSourceType=' . $digital_source_type, $filename ) );
		$written = null !== $output;

		do_action( 'jetpack_bump_stats_extras', 'image_editor_ai_marker', $written ? 'written' : 'write-failed' );

		return $written;
	}

	/**
	 * Runs a tool under timeout(1), since PHP's time limit ignores time spent in other programs.
	 *
	 * @param string[] $command The program and its arguments.
	 * @return string|null Its output, or null when it fails or times out.
	 */
	private static function run_tool( array $command ) {
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
			do_action( 'jetpack_bump_stats_extras', 'image_editor_ai_marker', 'timed-out' );
		}

		return 0 === $status ? implode( "\n", $output ) : null;
	}
}
