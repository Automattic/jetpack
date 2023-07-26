<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Handles concatenation of scripts and styles for enabled modules.
 *
 * @package automattic/jetpack
 */

/**
 * Provides concatenation of scripts and styles.
 */
class Jetpack_Concat {
	/**
	 * Holds a list of script handles that have been enqueued.
	 *
	 * @var array
	 */
	public $enqueued_scripts = array();

	/**
	 * Holds a list of style handles that have been enqueued.
	 *
	 * @var array
	 */
	public $enqueued_styles = array();

	/**
	 * Holds the inline data.
	 *
	 * @var string
	 */
	protected $inline_data = '';

	/**
	 * Holds the cache location.
	 *
	 * @var string
	 */
	protected $cache_folder;

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'jetpack_pre_activate_module', array( $this, 'flush_cache' ) );
		add_action( 'jetpack_pre_deactivate_module', array( $this, 'flush_cache' ) );

		$this->cache_folder = WP_CONTENT_DIR . '/concat-cache';
		if ( ! file_exists( $this->cache_folder ) ) {
			wp_mkdir_p( $this->cache_folder );
		}
	}

	/**
	 * Get the instance.
	 *
	 * @return Jetpack_Concat
	 */
	public static function get_instance() {
		static $instance;
		if ( empty( $instance ) ) {
			$instance = new self();
		}

		return $instance;
	}

	/**
	 * Get the current script key hash.
	 */
	public function get_script_hash() {
		return md5( implode( '-', array_keys( $this->enqueued_scripts ) ) ) . '.js';
	}

	/**
	 * Get current script file path.
	 */
	public function get_script_path() {

		return $this->cache_folder . '/' . $this->get_script_hash();
	}

	/**
	 * Get the current style key hash.
	 */
	public function get_style_hash() {
		return md5( implode( '-', array_keys( $this->enqueued_styles ) ) ) . '.css';
	}

	/**
	 * Get current style file path.
	 */
	public function get_style_path() {

		return $this->cache_folder . '/' . $this->get_style_hash();
	}

	/**
	 * Get current style file url.
	 */
	public function get_style_url() {
		$path = $this->get_style_path();

		return str_replace( ABSPATH, home_url() . '/', $path );
	}

	/**
	 * Get current script file url.
	 */
	public function get_script_url() {
		$path = $this->get_script_path();

		return str_replace( ABSPATH, home_url() . '/', $path );
	}

	/**
	 * Add a script handle to the enqueued array.
	 *
	 * @param string $handle The handle to add.
	 */
	public function add_script( $handle ) {
		$wp_scripts = wp_scripts();

		if ( empty( $wp_scripts->registered[ $handle ] ) || ! $this->is_local( $wp_scripts->registered[ $handle ]->src ) ) {
			return;
		}

		if ( ! empty( $wp_scripts->registered[ $handle ]->deps ) ) {
			$this->add_script_deps( $wp_scripts->registered[ $handle ] );
		}
		$this->enqueued_scripts[ $handle ] = $wp_scripts->registered[ $handle ];
		$wp_scripts->done[]                = $handle;
	}

	/**
	 * Add a style handle to the enqueued array.
	 *
	 * @param string $handle The handle to add.
	 */
	public function add_style( $handle ) {
		$wp_styles = wp_styles();

		// Check if src is remote.
		if ( empty( $wp_styles->registered[ $handle ] ) || ! $this->is_local( $wp_styles->registered[ $handle ]->src ) ) {
			return;
		}
		if ( ! empty( $wp_styles->registered[ $handle ]->deps ) ) {
			$this->add_style_deps( $wp_styles->registered[ $handle ] );
		}
		$this->enqueued_styles[ $handle ] = $wp_styles->registered[ $handle ];
		$wp_styles->done[]                = $handle;
	}

	/**
	 * Handle a scripts dependancies.
	 *
	 * @param _WP_Dependency $object The script object.
	 */
	public function add_script_deps( $object ) {
		$wp_scripts = wp_scripts();
		$deps       = $object->deps;
		foreach ( $deps as $dep ) {
			if ( isset( $wp_scripts->registered[ $dep ] ) && empty( $this->enqueued_scripts[ $dep ] ) ) {
				$this->add_script( $dep );
			}
		}
	}

	/**
	 * Handle a styles dependancies.
	 *
	 * @param _WP_Dependency $object The style object.
	 */
	public function add_style_deps( $object ) {
		$wp_styles = wp_styles();
		$deps      = $object->deps;
		foreach ( $deps as $dep ) {
			if ( isset( $wp_styles->registered[ $dep ] ) && empty( $this->enqueued_styles[ $dep ] ) ) {
				$this->add_style( $dep );
			}
		}
	}

	/**
	 * Build the cache file.
	 *
	 * @param string $type The type of asset to build.
	 */
	public function build_cache( $type ) {
		global $wp_filesystem;
		static $home_url;
		if ( ! $wp_filesystem ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
		}
		if ( ! $home_url ) {
			$home_url = home_url();
		}
		$content = array();
		if ( 'script' === $type ) {
			$file      = $this->get_script_path();
			$items     = $this->enqueued_scripts;
			$content[] = '// ' . implode( '-', array_keys( $this->enqueued_scripts ) );
		} else {
			$file      = $this->get_style_path();
			$items     = $this->enqueued_styles;
			$content[] = '// ' . implode( '-', array_keys( $this->enqueued_styles ) );
		}
		foreach ( $items as $object ) {
			$src = strtok( ABSPATH . ltrim( str_replace( $home_url, '', $object->src ), '/' ), '?' );
			if ( file_exists( $src ) ) {
				if ( ! empty( $object->extra['data'] ) ) {
					$this->inline_data .= "\r\n" . $object->extra['data'];
				}
				$content[] = $wp_filesystem->get_contents( $src );
			}
		}
		$wp_filesystem->put_contents( $file, implode( "\r\n", $content ) );
	}

	/**
	 * Prepare inline scripts.
	 *
	 * @param \_WP_Dependency $script The script dependency.
	 */
	public function prep_inline_scripts( $script ) {
		$hash = $this->get_script_hash();
		if ( ! empty( $script->extra['data'] ) ) {
			wp_add_inline_script( $hash, $script->extra['data'], 'before' );
		}
		if ( ! empty( $script->extra['after'] ) ) {
			foreach ( (array) $script->extra['after'] as $after ) {
				wp_add_inline_script( $hash, $after );
			}
		}
	}

	/**
	 * Prepare inline styles.
	 *
	 * @param \_WP_Dependency $style The style dependency.
	 */
	public function prep_inline_styles( $style ) {
		$hash = $this->get_style_hash();
		if ( ! empty( $style->extra['data'] ) ) {
			wp_add_inline_style( $hash, $style->extra['data'], 'before' );
		}
		if ( ! empty( $style->extra['after'] ) ) {
			foreach ( (array) $style->extra['after'] as $after ) {
				wp_add_inline_style( $hash, $after );
			}
		}
	}

	/**
	 * Check if the url is local or not.
	 *
	 * @param string $url The url to check.
	 *
	 * @return bool
	 */
	public function is_local( $url ) {
		static $host;
		if ( ! $host ) {
			$host = wp_parse_url( home_url(), PHP_URL_HOST );
		}
		$has_host = wp_parse_url( $url, PHP_URL_HOST );

		return empty( $has_host ) || $has_host === $host;
	}

	/**
	 * Clear all cache files when activating a module.
	 */
	public function flush_cache() {
		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
		}
		$wp_filesystem->delete( $this->cache_folder, true );
	}
}
