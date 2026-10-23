<?php
/**
 * The GD image editor for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * GD drops all metadata on save. Like Photon, this keeps one field: the XMP
 * DigitalSourceType, which marks AI-generated images.
 */
class Jetpack_WPCOM_Image_Editor_GD extends WP_Image_Editor_GD {

	/**
	 * The source's DigitalSourceType: '' when it has none, null until the first save.
	 *
	 * @var string|null
	 */
	private $digital_source_type = null;

	/**
	 * Saves the image, then writes the source's DigitalSourceType into it.
	 *
	 * @param string   $filename  Path to save the image to.
	 * @param callable $callback  GD function that writes the image.
	 * @param array    $arguments Arguments for the callback.
	 * @return bool
	 */
	protected function make_image( $filename, $callback, $arguments ) {
		// Read before this save can overwrite the source.
		if ( null === $this->digital_source_type ) {
			$this->digital_source_type = self::read_digital_source_type( $this->file );
		}

		$result = parent::make_image( $filename, $callback, $arguments );

		// Before image_make_intermediate_size, so filters on it see the final bytes.
		if ( $result && '' !== $this->digital_source_type && ! wp_is_stream( $filename ) ) {
			self::write_digital_source_type( $filename, $this->digital_source_type );
		}

		return $result;
	}

	/**
	 * Reads the DigitalSourceType from XMP, then from C2PA.
	 *
	 * @param string $file Path or URL of the source image.
	 * @return string The type, or '' when the file has none.
	 */
	private static function read_digital_source_type( $file ) {
		if ( preg_match( '|^https?://|', $file ) ) {
			return self::read_digital_source_type_from_url( $file );
		}

		$digital_source_type = self::read_xmp_digital_source_type( $file );

		return '' === $digital_source_type ? self::read_c2pa_digital_source_type( $file ) : $digital_source_type;
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

		$digital_source_type = self::read_digital_source_type( $temp );
		// A plain unlink(): wp_delete_file() hooks are for uploads, and this is a temp file.
		unlink( $temp ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink

		return $digital_source_type;
	}

	/**
	 * Reads the XMP DigitalSourceType with exiftool.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when the file has none or exiftool is missing.
	 */
	private static function read_xmp_digital_source_type( $file ) {
		$exiftool = jetpack_wpcom_exiftool_path();
		if ( ! $exiftool ) {
			return '';
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
		exec( escapeshellarg( $exiftool ) . ' -m -s3 -XMP-iptcExt:DigitalSourceType ' . escapeshellarg( $file ) . ' 2>/dev/null', $output, $status );

		return 0 === $status ? trim( implode( '', $output ) ) : '';
	}

	/**
	 * Some models mark their output only in C2PA. Reads the active manifest first,
	 * because c2patool lists manifests in no fixed order.
	 *
	 * @param string $file Path of the source image.
	 * @return string The type, or '' when the file has none or c2patool is missing.
	 */
	private static function read_c2pa_digital_source_type( $file ) {
		$c2patool = jetpack_wpcom_c2patool_path();
		// Without the settings, c2patool fetches remote manifest URLs found in the file.
		$settings = __DIR__ . '/c2pa-settings.json';
		if ( ! $c2patool || ! is_readable( $settings ) ) {
			return '';
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
		exec( escapeshellarg( $c2patool ) . ' --settings ' . escapeshellarg( $settings ) . ' ' . escapeshellarg( $file ) . ' 2>/dev/null', $output, $status );
		$store     = 0 === $status ? json_decode( implode( "\n", $output ), true ) : null;
		$manifests = (array) ( $store['manifests'] ?? array() );
		$active    = $store['active_manifest'] ?? '';
		if ( isset( $manifests[ $active ] ) ) {
			$manifests = array( $active => $manifests[ $active ] ) + $manifests;
		}

		foreach ( $manifests as $manifest ) {
			foreach ( (array) ( $manifest['assertions'] ?? array() ) as $assertion ) {
				foreach ( (array) ( $assertion['data']['actions'] ?? array() ) as $action ) {
					if ( ! empty( $action['digitalSourceType'] ) ) {
						do_action( 'jetpack_bump_stats_extras', 'image_editor_ai_marker', 'from-c2pa' );
						return $action['digitalSourceType'];
					}
				}
			}
		}

		return '';
	}

	/**
	 * Writes the type with exiftool. It renames a new file over the old one, so a killed write can't truncate it.
	 *
	 * @param string $filename            Path of the saved image.
	 * @param string $digital_source_type The type to write.
	 */
	private static function write_digital_source_type( $filename, $digital_source_type ) {
		$exiftool = jetpack_wpcom_exiftool_path();
		if ( ! $exiftool ) {
			return;
		}

		$command = escapeshellarg( $exiftool ) . ' -m -q -overwrite_original '
			. escapeshellarg( '-XMP-iptcExt:DigitalSourceType=' . $digital_source_type ) . ' '
			. escapeshellarg( $filename ) . ' 2>/dev/null';
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
		exec( $command, $output, $status );

		do_action( 'jetpack_bump_stats_extras', 'image_editor_ai_marker', 0 === $status ? 'written' : 'write-failed' );
	}
}
