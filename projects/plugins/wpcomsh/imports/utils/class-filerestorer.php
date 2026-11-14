<?php
/**
 * FileRestorer file.
 *
 * @package wpcomsh
 */

namespace Imports\Utils;

require_once __DIR__ . '/../class-backup-import-action.php';

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplQueue;
use WP_Error;

/**
 * Class FileRestorer
 *
 * The FileRestorer class is used to restore files from a source directory
 * to a destination directory. It uses a queue to manage the files to be
 * restored, and it can optionally log its operations.
 */
class FileRestorer extends \Imports\Backup_Import_Action {
	/**
	 * The source directory from which files will be restored.
	 *
	 * @var string
	 */
	private $source_dir;
	/**
	 * The destination directory to which files will be restored.
	 *
	 * @var string
	 */
	private $dest_dir;
	/**
	 * The queue that manages the files to be restored.
	 *
	 * @var \SplQueue
	 */
	private $queue;
	/**
	 * The list of symlinked directories.
	 *
	 * @var array
	 */
	private $symlinked_dirs;
	/**
	 * The total number of files to be restored.
	 *
	 * @var int
	 */
	private $total_count;
	/**
	 * Uploaded themes that are imported under a new slug, keyed by their uploaded slug.
	 *
	 * @var array<string, string>
	 */
	private $theme_renames = array();
	/**
	 * The directory holding the versions of managed themes, e.g. `/wordpress/themes/`.
	 *
	 * @var string
	 */
	private $managed_themes_root;
	const THEMES_DIR  = 'wp-content/themes/';
	const PLUGINS_DIR = 'wp-content/plugins/';
	// Appended to the slug of an edited managed theme, so it is imported next to the managed copy.
	const RENAMED_THEME_SUFFIX = '-imported';

	/**
	 * FileRestorer constructor.
	 *
	 * Initializes a new instance of the FileRestorer class with the specified
	 * source directory, destination directory, and optional logger.
	 *
	 * @param string               $source_dir The source directory.
	 * @param string               $dest_dir The destination directory.
	 * @param null|LoggerInterface $logger An optional logger.
	 * @param string               $managed_themes_root The directory holding the versions of managed themes.
	 */
	public function __construct( $source_dir, $dest_dir, $logger = null, $managed_themes_root = '/wordpress/themes/' ) {
		parent::__construct( $logger );
		$this->source_dir          = trailingslashit( $source_dir );
		$this->dest_dir            = trailingslashit( $dest_dir );
		$this->queue               = new SplQueue();
		$this->total_count         = 0;
		$this->symlinked_dirs      = array();
		$this->managed_themes_root = trailingslashit( $managed_themes_root );
	}

	/**
	 * The uploaded themes imported under a new slug, keyed by their uploaded slug.
	 *
	 * The database still refers to them by their uploaded slug; SQL_Postprocessor::rename_themes()
	 * updates those references.
	 *
	 * @return array<string, string>
	 */
	public function get_theme_renames() {
		return $this->theme_renames;
	}

	/**
	 * Enqueues the files to be restored.
	 *
	 * This method iterate over the files in the source directory and enqueue them for restoration.
	 *
	 * @return bool|\WP_Error True if at least one file was enqueued, or a WP_Error if no files were enqueued.
	 */
	public function enqueue_files() {
		// Install the stock default themes first: an uploaded default theme is compared against them.
		// This shouldn't be a hard stop, but we should log it.
		$this->install_default_themes();

		$dir_iterator         = new RecursiveDirectoryIterator( $this->source_dir, RecursiveDirectoryIterator::SKIP_DOTS );
		$iterator             = new RecursiveIteratorIterator( $dir_iterator, RecursiveIteratorIterator::SELF_FIRST );
		$this->symlinked_dirs = $this->get_symlinked_dirs();
		$this->resolve_managed_themes();
		foreach ( $iterator as $fileinfo ) {
			if ( $fileinfo->isFile() && $this->should_enqueue_file( $fileinfo ) ) {
				$this->queue->enqueue( $this->create_file_info_array( $fileinfo ) );
				++$this->total_count;
			}
		}

		$this->log( "Total files to copy: $this->total_count" );
		if ( $this->total_count === 0 ) {
			return new WP_Error( 'file_queue_failed', __( 'No files are queued.', 'wpcomsh' ) );
		}

		return true;
	}

	/**
	 * Decides what happens to each uploaded theme that the site already has a managed copy of: a
	 * stock default theme, or a theme symlinked to WordPress.com's managed tree.
	 *
	 * An unmodified upload keeps the managed copy, so the site stays on the managed, updated theme
	 * and its files aren't copied. An upload whose files differ from the same version of the managed
	 * theme was edited: it is imported under a new slug, next to the managed copy, so the edits are
	 * not lost. When there is no copy of the same version to compare against, the upload can't be
	 * told apart from an older stock version, and it keeps the managed copy.
	 */
	private function resolve_managed_themes() {
		$source_themes_dir = $this->source_dir . self::THEMES_DIR;
		if ( ! is_dir( $source_themes_dir ) ) {
			return;
		}

		foreach ( new \DirectoryIterator( $source_themes_dir ) as $fileinfo ) {
			if ( $fileinfo->isDot() || ! $fileinfo->isDir() ) {
				continue;
			}

			$slug           = $fileinfo->getFilename();
			$theme_dir      = self::THEMES_DIR . $slug;
			$dest_theme_dir = $this->dest_dir . $theme_dir;
			if ( ! is_dir( $dest_theme_dir ) ) {
				continue;
			}

			$is_symlinked = in_array( $theme_dir, $this->symlinked_dirs, true );
			if ( ! $is_symlinked && ! self::is_default_theme_slug( $slug ) ) {
				// A theme the site has its own copy of, e.g. from an earlier import: overwrite it.
				continue;
			}

			$source_theme_dir = $fileinfo->getPathname();
			$reference_dir    = $this->get_theme_reference_dir( $slug, $source_theme_dir, $dest_theme_dir );
			if ( null === $reference_dir || $this->theme_matches_reference( $source_theme_dir, $reference_dir ) ) {
				if ( ! $is_symlinked ) {
					$this->symlinked_dirs[] = $theme_dir;
				}
				$this->log( "Theme $slug: keeping the managed copy." );
				continue;
			}

			$new_slug                     = $this->get_renamed_theme_slug( $slug );
			$this->theme_renames[ $slug ] = $new_slug;
			$this->symlinked_dirs         = array_values( array_diff( $this->symlinked_dirs, array( $theme_dir ) ) );
			$this->log( "Theme $slug differs from the managed copy: importing it as $new_slug." );
		}
	}

	/**
	 * Whether a theme slug is one of the default themes the importer installs from the stock copy.
	 *
	 * @param string $slug The theme slug.
	 * @return bool
	 */
	public static function is_default_theme_slug( $slug ) {
		return 1 === preg_match( '/^twentytwenty[a-z]*$/', $slug );
	}

	/**
	 * The stock copy of the same version as an uploaded theme, to compare the upload against.
	 *
	 * @param string $slug             The theme slug.
	 * @param string $source_theme_dir The uploaded theme's directory.
	 * @param string $dest_theme_dir   The site's copy of the theme.
	 * @return string|null The directory of the stock copy, or null when there is none to compare against.
	 */
	private function get_theme_reference_dir( $slug, $source_theme_dir, $dest_theme_dir ) {
		$version = self::get_theme_version( $source_theme_dir );
		if ( '' === $version ) {
			return null;
		}

		$versioned_dir = $this->managed_themes_root . $slug . '/' . $version;
		if ( is_dir( $versioned_dir ) ) {
			return $versioned_dir;
		}

		if ( self::get_theme_version( $dest_theme_dir ) === $version ) {
			return $dest_theme_dir;
		}

		return null;
	}

	/**
	 * The version in a theme's style.css header.
	 *
	 * @param string $theme_dir The theme directory.
	 * @return string The version, or '' when there is none.
	 */
	private static function get_theme_version( $theme_dir ) {
		$style_css = trailingslashit( $theme_dir ) . 'style.css';
		if ( ! is_file( $style_css ) ) {
			return '';
		}

		$headers = get_file_data( $style_css, array( 'Version' => 'Version' ) );

		return trim( $headers['Version'] );
	}

	/**
	 * Whether every uploaded file of a theme is the same as in the stock copy. Dotfiles are ignored.
	 *
	 * @param string $source_theme_dir The uploaded theme's directory.
	 * @param string $reference_dir    The stock copy's directory.
	 * @return bool
	 */
	private function theme_matches_reference( $source_theme_dir, $reference_dir ) {
		$source_theme_dir = trailingslashit( $source_theme_dir );
		$reference_dir    = trailingslashit( $reference_dir );
		$iterator         = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $source_theme_dir, RecursiveDirectoryIterator::SKIP_DOTS )
		);

		foreach ( $iterator as $fileinfo ) {
			if ( ! $fileinfo->isFile() || str_starts_with( $fileinfo->getFilename(), '.' ) ) {
				continue;
			}

			$relative_path  = substr( $fileinfo->getPathname(), strlen( $source_theme_dir ) );
			$reference_file = $reference_dir . $relative_path;
			if (
				! is_file( $reference_file ) ||
				filesize( $reference_file ) !== $fileinfo->getSize() ||
				md5_file( $reference_file ) !== md5_file( $fileinfo->getPathname() )
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * The slug an edited managed theme is imported under: one that no managed theme uses.
	 *
	 * @param string $slug The uploaded theme's slug.
	 * @return string
	 */
	private function get_renamed_theme_slug( $slug ) {
		$new_slug = $slug . self::RENAMED_THEME_SUFFIX;
		$i        = 2;
		while ( is_link( $this->dest_dir . self::THEMES_DIR . $new_slug ) ) {
			$new_slug = $slug . self::RENAMED_THEME_SUFFIX . '-' . $i;
			++$i;
		}

		return $new_slug;
	}

	/**
	 * Restores files from the source directory to the destination directory.
	 *
	 * This method dequeues files from the queue and copies them from the source directory to the destination directory.
	 * It skips files that are inside a symlinked theme or plugin, or that are symbolic links themselves.
	 * It also creates any necessary directories in the destination directory.
	 * If a file cannot be copied for any reason, it is logged and the copy operation continues with the next file.
	 * After all files have been processed, it logs the number of files copied, skipped, and failed.
	 * If no files were copied, it returns a WP_Error; otherwise, it returns true.
	 *
	 * @return bool|\WP_Error True if at least one file was copied, or a WP_Error if no files were copied.
	 */
	public function restore_files() {
		$file_seen_count = 0;
		$copied_count    = 0;
		$skipped_count   = 0;
		$failed_count    = 0;

		while ( ! $this->queue->isEmpty() ) {
			$file_info_array = $this->queue->dequeue();
			$file_path       = $file_info_array['source_file_path'];
			$dest_path       = $file_info_array['dest_file_path'];
			$relative_path   = $file_info_array['relative_file_path'];
			$file_type       = $file_info_array['file_type'];
			++$file_seen_count;

			// Skip if the file is inside a symlinked theme or plugin
			if ( $file_type === 'theme_files' || $file_type === 'plugin_files' ) {
				if ( $this->is_in_symlinked_directory( $file_type, $relative_path ) ) {
					++$skipped_count;
					$this->log( "$file_seen_count/$this->total_count entries seen. $relative_path is inside a symlinked directory, skipping..." );
					continue;
				}
			}

			if ( is_link( $dest_path ) ) {
				++$skipped_count;
				$this->log( "$file_seen_count/$this->total_count entries seen. $relative_path is a symbolic link, skipping..." );
				continue;
			}

			if ( ! is_dir( dirname( $dest_path ) ) ) {
				if ( ! wp_mkdir_p( dirname( $dest_path ) ) ) {
					$this->log( 'Failed to create directory ' . dirname( $dest_path ) );
					continue;
				} else {
					$this->log( 'Created directory ' . dirname( $dest_path ) );
				}
			}

			if ( ! copy( $file_path, $dest_path ) ) {
				++$failed_count;
				$this->log( "$file_seen_count/$this->total_count entries seen. Failed to copy: $relative_path" );
			} else {
				++$copied_count;
				$this->log( "$file_seen_count/$this->total_count entries seen. Restoring: $relative_path" );
				if ( $file_type === 'theme_files' ) {
					$this->update_renamed_parent_theme( $relative_path, $dest_path );
				}
			}
		}

		$this->log( "Finished copying $this->total_count files. Copied: $copied_count files. Skipped: $skipped_count files. Failed: $failed_count files." );

		if ( $copied_count === 0 ) {
			return new \WP_Error( 'file_restoration_failed', __( 'No files are restored.', 'wpcomsh' ) );
		}

		return true;
	}

	/**
	 * Retrieves the list of symlinked directories.
	 *
	 * This method iterates over the themes and plugins directories in the source directory,
	 * and checks each subdirectory to determine if it is symlinked in the destination directory.
	 * If a subdirectory is symlinked, or if it is a plugin directory managed by us, its name is added to the list.
	 *
	 * @return array The list of symlinked directory names.
	 */
	private function get_symlinked_dirs() {
		$dirs           = array(
			$this->source_dir . self::THEMES_DIR,
			$this->source_dir . self::PLUGINS_DIR,
		);
		$symlinked_dirs = array();

		foreach ( $dirs as $dir ) {
			$dir_iterator = array();

			try {
				$dir_iterator = new \DirectoryIterator( $dir );
			} catch ( \Exception $e ) {
				// The directory does not exist.
				continue;
			}

			foreach ( $dir_iterator as $fileinfo ) {
				$dest_dir = str_replace( $this->source_dir, $this->dest_dir, $fileinfo->getPathname() );
				// check if it's symlinked and not a dot directory on destination
				if ( $fileinfo->isDir() && ! $fileinfo->isDot() ) {
					$dir_name = str_replace( $this->dest_dir, '', $dest_dir );
					// if it's not exist on destination, skip it
					if ( ! is_dir( $dest_dir ) ) {
						continue;
					}
					if ( is_link( $dest_dir ) ) {
						$symlinked_dirs[] = $dir_name;
					} elseif ( strpos( $dir_name, self::PLUGINS_DIR ) === 0 ) {
						// if it's a plugin directory, check if the plugin is managed by us
						$parts = explode( '/', $dir_name );
						// Last part is the plugin directory name
						$plugin_to_symlink = array_pop( $parts );
						if ( $this->is_plugin_symlinked( $plugin_to_symlink ) ) {
							$symlinked_dirs[] = $dir_name;
						}
					}
				}
			}
		}

		return $symlinked_dirs;
	}

	/**
	 * Determines if a file should be enqueued for restoration.
	 *
	 * This method checks if a file is excluded from restoration. If the file is excluded,
	 * it logs a message and returns false. Otherwise, it returns true.
	 *
	 * @param \SplFileInfo $fileinfo The file to check.
	 * @return bool True if the file should be enqueued, false otherwise.
	 */
	private function should_enqueue_file( $fileinfo ) {
		$source_file_path   = $fileinfo->getRealPath();
		$relative_file_path = str_replace( $this->source_dir, '', $source_file_path );

		if ( $this->is_file_excluded( $source_file_path ) ) {
			$this->log( "Excluded: $relative_file_path" );
			return false;
		}

		return true;
	}

	/**
	 * Creates an array of file information for a given file.
	 *
	 * This method takes a SplFileInfo object and returns an array containing the source file path,
	 * destination file path, relative file path, and file type.
	 *
	 * @param \SplFileInfo $fileinfo The file to create information for.
	 * @return array An array containing the source file path, destination file path, relative file path, and file type.
	 */
	private function create_file_info_array( $fileinfo ) {
		$source_file_path   = $fileinfo->getRealPath();
		$relative_file_path = str_replace( $this->source_dir, '', $source_file_path );
		$file_type          = $this->get_file_type( $relative_file_path );
		$dest_relative_path = $relative_file_path;

		if ( $file_type === 'theme_files' ) {
			$slug = $this->get_extension_slug_from_path( $relative_file_path );
			if ( $slug && isset( $this->theme_renames[ $slug ] ) ) {
				$dest_relative_path = self::THEMES_DIR . $this->theme_renames[ $slug ] . substr( $relative_file_path, strlen( self::THEMES_DIR . $slug ) );
			}
		}

		return array(
			'source_file_path'   => $source_file_path,
			'dest_file_path'     => $this->dest_dir . $dest_relative_path,
			'relative_file_path' => $relative_file_path,
			'file_type'          => $file_type,
		);
	}

	/**
	 * Points a restored child theme at its parent's new slug, when the parent was renamed.
	 *
	 * @param string $relative_path The uploaded file's path, relative to the source directory.
	 * @param string $dest_path     The restored file's path.
	 */
	private function update_renamed_parent_theme( $relative_path, $dest_path ) {
		if ( ! $this->theme_renames || ! preg_match( '#^' . preg_quote( self::THEMES_DIR, '#' ) . '[^/]+/style\.css$#', $relative_path ) ) {
			return;
		}

		$contents = file_get_contents( $dest_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( false === $contents || ! preg_match( '/^([ \t\/*#@]*Template:[ \t]*)([^\r\n]+?)[ \t]*$/mi', $contents, $matches ) ) {
			return;
		}

		$parent = $matches[2];
		if ( ! isset( $this->theme_renames[ $parent ] ) ) {
			return;
		}

		$contents = str_replace( $matches[0], $matches[1] . $this->theme_renames[ $parent ], $contents );
		file_put_contents( $dest_path, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$this->log( "Pointed $relative_path at the renamed parent theme {$this->theme_renames[ $parent ]}." );
	}

	/**
	 * Checks if a file is in a symlinked directory.
	 *
	 * This method checks if the specified file, identified by its type and path,
	 * is located within a symlinked directory. It does this by extracting the
	 * extension slug from the file path and checking if the resulting directory
	 * is in the list of symlinked directories.
	 *
	 * @param string $file_type The type of the file ('theme_files', 'plugin_files', or 'regular_files').
	 * @param string $file_path The path of the file to check.
	 * @return bool True if the file is in a symlinked directory, false otherwise.
	 */
	private function is_in_symlinked_directory( $file_type, $file_path ) {
		$slug = $this->get_extension_slug_from_path( $file_path );
		$dir  = null;
		if ( $slug ) {
			if ( $file_type === 'theme_files' ) {
				$dir = self::THEMES_DIR . $slug;
			} else {
				$dir = self::PLUGINS_DIR . $slug;
			}
		}
		if ( in_array( $dir, $this->symlinked_dirs, true ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Extracts the extension slug from a file path.
	 *
	 * This method checks if the specified file path is part of a theme or a plugin,
	 * and if so, extracts and returns the extension slug. If the file is not part of a theme or a plugin,
	 * it returns null.
	 *
	 * @param string $file_path The path of the file to check.
	 * @return string|null The extension slug if the file is part of a theme or a plugin, or null otherwise.
	 */
	private function get_extension_slug_from_path( $file_path ) {
		$dir = dirname( $file_path );
		if ( strpos( $dir, self::THEMES_DIR ) === 0 ) {
			$relative_path = substr( $dir, strlen( self::THEMES_DIR ) );
			$slug          = explode( '/', $relative_path )[0];
			return $slug;
		}

		if ( strpos( $dir, self::PLUGINS_DIR ) === 0 ) {
			$relative_path = substr( $dir, strlen( self::PLUGINS_DIR ) );
			$slug          = explode( '/', $relative_path )[0];
			return $slug;
		}

		return null;
	}

	/**
	 * Determines the type of a file based on its path.
	 *
	 * This method checks if the specified file path is part of a theme or a plugin,
	 * and returns a string indicating its type.
	 *
	 * @param string $file_path The path of the file to check.
	 * @return string 'theme_files' if the file is part of a theme, 'plugin_files' if the file is part of a plugin, or 'regular_files' otherwise.
	 */
	public function get_file_type( $file_path ) {

		if ( $this->is_theme_file( $file_path ) ) {
			return 'theme_files';
		}

		if ( $this->is_plugin_file( $file_path ) ) {
			return 'plugin_files';
		}

		return 'regular_files';
	}

	/**
	 * Checks if a file is part of a themes.
	 *
	 * @param string $file_path The path of the file to check.
	 * @return bool True if the file is part of a themes, false otherwise.
	 */
	public function is_theme_file( $file_path ) {
		if ( strpos( $file_path, self::THEMES_DIR ) !== false ) {
			return true;
		}

		return false;
	}
	/**
	 * Checks if a file is part of a plugins.
	 *
	 * @param string $file_path The path of the file to check.
	 * @return bool True if the file is part of a plugins, false otherwise.
	 */
	public function is_plugin_file( $file_path ) {
		if ( strpos( $file_path, self::PLUGINS_DIR ) !== false ) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if a plugin is symlinked.
	 *
	 * This method checks if the specified plugin is symlinked by checking
	 * if the realpath of the plugin's relative path exists.
	 *
	 * @param string $plugin_to_symlink The name of the plugin to check.
	 * @return bool True if the plugin is symlinked, false otherwise.
	 */
	public function is_plugin_symlinked( $plugin_to_symlink ) {
		$managed_plugin_relative_path = "/../../../../wordpress/plugins/$plugin_to_symlink/latest";
		if ( realpath( $managed_plugin_relative_path ) !== false ) {
			return true;
		}
		return false;
	}

	/**
	 * Checks if a file should be excluded from restoration.
	 *
	 * This method checks if a file matches any of the exclusion patterns
	 * defined in the get_file_exclusion_list method.
	 *
	 * @param string $path The path of the file to check.
	 * @return bool True if the file should be excluded, false otherwise.
	 */
	public function is_file_excluded( $path ) {
		foreach ( $this->get_file_exclusion_list() as $exclusion ) {
			if ( preg_match( $exclusion['pattern'], $path ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Installs default themes on the destination site via wp cli and skip if it's already symlinked.
	 *
	 * This function scans the themes directory in the source directory, identifies the default themes,
	 * and installs them on the destination site if they are not already installed.
	 */
	public function install_default_themes() {
		$source_themes_dir = $this->source_dir . self::THEMES_DIR;
		$dest_themes_dir   = $this->dest_dir . self::THEMES_DIR;

		if ( ! is_dir( $source_themes_dir ) ) {
			$this->log( 'Install default themes: Source themes directory does not exist.' );
			// Handle the case where the source themes directory does not exist
			return;
		}

		$default_themes = glob( $source_themes_dir . '/twentytwenty*', GLOB_ONLYDIR );

		foreach ( $default_themes as $theme_dir ) {
			$theme_slug = basename( $theme_dir );
			if ( ! is_dir( $dest_themes_dir . '/' . $theme_slug ) ) {
				// The theme is not installed on the destination site, so install it
				$this->log( 'Installing theme: ' . $theme_slug );
				$result = self::install_theme( $theme_slug );
				$this->log( 'Install theme result: ' . $result );
			}
		}
	}

	/**
	 * Returns the list of file exclusion patterns.
	 *
	 * @return array The list of file exclusion patterns.
	 */
	public function get_file_exclusion_list() {
		return array(
			array(
				'pattern' => '/\/wp-admin\//',
				'message' => 'Excluded because path includes /wp-admin/.',
			),
			array(
				'pattern' => '/\/wp-includes\//',
				'message' => 'Excluded because path includes /wp-includes/.',
			),
			array(
				'pattern' => '/\.sql$/',
				'message' => 'Excluded because path is a .sql file.',
			),
			array(
				'pattern' => '/\/wp-content\/mu-plugins\//',
				'message' => 'Excluded because path includes /wp-content/mu-plugins/',
			),
			array(
				'pattern' => '/\/wp-content\/database\//',
				'message' => 'Excluded because path includes /wp-content/database/.',
			),
			array(
				'pattern' => '/\/wp-content\/plugins\/wordpress-importer\//',
				'message' => 'Excluded because path includes /wp-content/plugins/wordpress-importer/.',
			),
			array(
				'pattern' => '/\/wp-content\/plugins\/sqlite-database-integration\//',
				'message' => 'Excluded because path includes /wp-content/plugins/sqlite-database-integration/.',
			),
			array(
				'pattern' => '/\/wp-config\.php$/',
				'message' => 'Excluded because file is wp-config.php.',
			),
		);
	}

	/**
	 * Installs a theme using WP-CLI.
	 *
	 * @param string $theme_slug The slug of the theme to install.
	 * @return mixed
	 */
	public static function install_theme( $theme_slug ) {
		return self::run_command( '--skip-plugins --skip-themes --format=json theme install ' . $theme_slug, array( 'return' => true ) );
	}

	/**
	 * Run a WP-CLI command.
	 *
	 * @param string $command The command to run.
	 * @param array  $args    The arguments to pass to the command.
	 *
	 * @return mixed
	 */
	public static function run_command( $command, $args = array() ) {
		if ( class_exists( 'WP_CLI' ) ) {
			return \WP_CLI::runcommand( $command, $args );
		}

		return false;
	}
}
