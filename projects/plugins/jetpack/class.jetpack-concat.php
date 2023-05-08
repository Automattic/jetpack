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
	protected $enqueued_scripts = array();

	/**
	 * Holds a list of style handles that have been enqueued.
	 *
	 * @var array
	 */
	protected $enqueued_styles = array();

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
		add_action( 'wp_footer', array( $this, 'do_script_enqueue' ), 100 );
		add_action( 'wp_enqueue_scripts', array( $this, 'do_style_enqueue' ), 100 );
		$this->cache_folder = WP_CONTENT_DIR . '/jetpack-cache';
		if ( ! file_exists( $this->cache_folder ) ) {
			wp_mkdir_p( $this->cache_folder );
		}
	}

	/**
	 * Get the current script key hash.
	 */
	protected function get_script_hash() {
		return md5( implode( '-', array_keys( $this->enqueued_scripts ) ) ) . '.js';
	}

	/**
	 * Get current script file path.
	 */
	protected function get_script_path() {

		return $this->cache_folder . '/' . $this->get_script_hash();
	}

	/**
	 * Get the current style key hash.
	 */
	protected function get_style_hash() {
		return md5( implode( '-', array_keys( $this->enqueued_styles ) ) ) . '.css';
	}

	/**
	 * Get current style file path.
	 */
	protected function get_style_path() {

		return $this->cache_folder . '/' . $this->get_style_hash();
	}

	/**
	 * Get current style file url.
	 */
	protected function get_style_url() {
		$path = $this->get_style_path();

		return str_replace( ABSPATH, home_url() . '/', $path );
	}

	/**
	 * Get current script file url.
	 */
	protected function get_script_url() {
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
		if ( empty( $wp_scripts->registered[ $handle ] ) ) {
			return;
		}
		if ( ! empty( $wp_scripts->registered[ $handle ]->deps ) ) {
			$this->add_script_deps( $wp_scripts->registered[ $handle ] );
		}
		vdump( $handle, false );
		$this->enqueued_scripts[ $handle ] = $wp_scripts->registered[ $handle ];
	}

	/**
	 * Add a style handle to the enqueued array.
	 *
	 * @param string $handle The handle to add.
	 */
	public function add_style( $handle ) {
		$wp_styles = wp_styles();
		if ( empty( $wp_styles->registered[ $handle ] ) ) {
			return;
		}
		if ( ! empty( $wp_styles->registered[ $handle ]->deps ) ) {
			$this->add_script_deps( $wp_styles->registered[ $handle ] );
		}
		$this->enqueued_styles[ $handle ] = $wp_styles->registered[ $handle ];
	}

	/**
	 * Handle a sscripts dependancies.
	 *
	 * @param _WP_Dependency $object The script object.
	 */
	protected function add_script_deps( $object ) {
		$wp_scripts = wp_scripts();
		$deps       = $object->deps;
		foreach ( $deps as $dep ) {
			if ( isset( $wp_scripts->registered[ $dep ] ) && empty( $this->enqueued_scripts[ $dep ] ) ) {
				$dependancy = $wp_scripts->registered[ $dep ];

				if ( ! empty( $dependancy->deps ) ) {
					$this->add_script_deps( $dependancy );
				}
				$this->enqueued_scripts[ $dep ] = $dependancy;
			}
		}
	}

	/**
	 * Build the cache file.
	 *
	 * @param string $type The type of asset to build.
	 */
	protected function build_cache( $type ) {
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
			$file  = $this->get_script_path();
			$items = $this->enqueued_scripts;
		} else {
			$file  = $this->get_style_path();
			$items = $this->enqueued_styles;
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
	 * Enqueue the script package.
	 */
	public function do_script_enqueue() {

		if ( ! empty( $this->enqueued_scripts ) ) {
			$path = $this->get_script_path();
			if ( ! file_exists( $path ) ) {
				$this->build_cache( 'script' );
			}
			if ( ! empty( $this->inline_data ) ) {
				wp_add_inline_script( $this->get_script_hash(), $this->inline_data, 'before' );
			}
			wp_enqueue_script( $this->get_script_hash(), $this->get_script_url() );
			$this->enqueued_scripts = array();
		}
	}

	/**
	 * Enqueue the style package.
	 */
	public function do_style_enqueue() {
		if ( ! empty( $this->enqueued_styles ) ) {
			$path = $this->get_style_path();
			if ( ! file_exists( $path ) ) {
				$this->build_cache( 'style' );
			}
			wp_enqueue_style( $this->get_style_hash(), $this->get_style_url() );
			$this->enqueued_styles = array();
		}
	}
}
