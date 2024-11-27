<?php
/**
 * Filesystem-based key-value storage implementation.
 *
 * @package automattic/jetpack-boost-core
 */

namespace Automattic\Jetpack\Boost_Core\Lib\Storage;

/**
 * Class Filesystem_Storage
 */
class Filesystem_Storage implements KV_Storage {
	const FILE_CONTENT_PREFIX = "<?php \n//";

	/**
	 * The path to the storage directory.
	 *
	 * @var string
	 */
	private $path;

	/**
	 * Constructor.
	 *
	 * @param string $path The path to the storage directory.
	 */
	public function __construct( $path ) {
		$this->path = $path;
	}

	/**
	 * Get a value from storage.
	 *
	 * @param string $key Storage key.
	 * @return mixed|null Value or null if not found.
	 */
	public function get( $key ) {
		$file = $this->get_storage_file_path( $key );

		$wp_filesystem = $this->get_wp_filesystem();

		$content = $wp_filesystem->get_contents( $file );
		if ( ! $content ) {
			return null;
		}
		$content = substr( $content, strlen( self::FILE_CONTENT_PREFIX ) );
		$data    = json_decode( $content, true );

		// Check if the data is expired.
		if ( $data['expire'] !== null && $data['expire'] < time() ) {
			$this->delete( $key );
			return null;
		}

		return $data['data'];
	}

	/**
	 * Set a value in storage.
	 *
	 * @param string $key Storage key.
	 * @param mixed  $value Value to store.
	 * @param int    $expiry Expiry in seconds.
	 * @return bool Success.
	 */
	public function set( $key, $value, $expiry = YEAR_IN_SECONDS ) {
		$file = $this->get_storage_file_path( $key );

		// Ensure the directory exists.
		$wp_filesystem = $this->get_wp_filesystem();
		$this->ensure_directory_exists( $file );

		$data = array(
			'expire' => time() + $expiry,
			'data'   => $value,
		);

		$file_content = self::FILE_CONTENT_PREFIX . wp_json_encode( $data, true );

		return $wp_filesystem->put_contents( $file, $file_content, FS_CHMOD_FILE );
	}

	/**
	 * Ensures the directory exists for the given file path.
	 *
	 * @param string $file File path to check directory for.
	 */
	private function ensure_directory_exists( $file ) {
		$wp_filesystem = $this->get_wp_filesystem();
		$dir           = dirname( $file );

		if ( ! $wp_filesystem->exists( $dir ) ) {
			// Recursively ensure the directory exists.
			$this->ensure_directory_exists( $dir );

			$wp_filesystem->mkdir( $dir, FS_CHMOD_DIR, true );
		}
	}

	/**
	 * Delete a value from storage.
	 *
	 * @param string $key Storage key.
	 * @return bool Success.
	 */
	public function delete( $key ) {
		$file = $this->get_storage_file_path( $key );

		$wp_filesystem = $this->get_wp_filesystem();

		return $wp_filesystem->delete( $file );
	}

	/**
	 * Clear all values from storage.
	 */
	public function clear() {
		$wp_filesystem = $this->get_wp_filesystem();

		return $wp_filesystem->delete( $this->path, true );
	}

	/**
	 * Remove expired entries from storage.
	 */
	public function garbage_collect() {
		// Loop through all files in the storage directory and delete expired ones.
		$files = glob( $this->path . '/*' );
		$count = 0;
		foreach ( $files as $file ) {
			if ( is_file( $file ) ) {
				$wp_filesystem = $this->get_wp_filesystem();
				$content       = $wp_filesystem->get_contents( $file );

				if ( null === $content ) {
					$wp_filesystem->delete( $file );
					++$count;
					continue;
				}
				$data = maybe_unserialize( $content );
				if ( null === $data || ! isset( $data['expire'] ) ) {
					$wp_filesystem->delete( $file );
					++$count;
					continue;
				}
				if ( null !== $data['expire'] && $data['expire'] < time() ) {
					$wp_filesystem->delete( $file );
					++$count;
				}
			}
		}

		return $count;
	}

	/**
	 * Get the path to the storage file for a given key.
	 *
	 * @param string $key Storage key.
	 * @return string Path to the storage file.
	 */
	private function get_storage_file_path( $key ) {
		$key = sanitize_key( $key );
		return WP_CONTENT_DIR . '/boost-cache/kv/' . $this->path . '/' . $key . '.php';
	}

	/**
	 * Get the WordPress filesystem instance.
	 *
	 * @return \WP_Filesystem_Base WordPress filesystem instance.
	 */
	private function get_wp_filesystem() {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		WP_Filesystem();
		global $wp_filesystem;

		return $wp_filesystem;
	}
}
