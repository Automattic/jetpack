<?php

/**
 * Experimental file sync
 */

require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';

class Jetpack_Sync_Files {
	const FILE_HASH_SIZE = 4096;
	const POST_TYPE_BACKUP = 'jetpack_backup';
	const QUEUE_NAME = 'backup';

	// singleton functions
	private static $instance;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	// this is necessary because you can't use "new" when you declare instance properties >:(
	protected function __construct() {
		$this->init();
	}

	private function init() {
		// register Backup, Directory content types
		register_post_type( self::POST_TYPE_BACKUP, array(
			'description' => __( 'Jetpack Backup', 'jetpack' ),
			'rewrite' => array(
				'slug'       => 'backup',
				'with_front' => false,
				'feeds'      => false,
				'pages'      => false,
			),
			'public'          => false,
			'show_ui'         => false,
			'capability_type' => 'backup',
			'map_meta_cap'    => false,
			'has_archive'     => false,
			'query_var'       => 'backup',
			'show_in_rest'    => false,
		) );
	}

	public function backup( $label = null ) {
		if ( ! $label ) {
			$label = "Backup " . current_time( 'mysql' );
		}

		// TODO: check if another backup is already in progress
		$backup = $this->get_running_backup();

		if ( $backup ) {
			return new WP_Error( 'multiple_backups', 'There is already a running backup' );
		}

		return wp_insert_post(
			array (
				'post_title' => $label,
				'post_type' => self::POST_TYPE_BACKUP,
			)
		);
	}

	public function cancel_backup( $post_id ) {
		$backup = get_post( $post_id );

		if ( ! $backup || self::POST_TYPE_BACKUP !== $backup->post_type ) {
			return new WP_Error( 'no_such_backup', 'No such backup with that ID' );
		}

		return wp_trash_post( $post_id );
	}

	private function get_running_backup() {
		$running_backups = get_posts( array(
			'post_type' => self::POST_TYPE_BACKUP,
			'post_status' => 'draft'
		) );

		if ( empty( $running_backups ) ) {
			return false;
		} elseif ( count( $running_backups ) > 1 ) {
			return new WP_Error( 'multiple_backups', 'More than one running backup - this should never happen' );
		} else {
			return reset( $running_backups ); // first element
		}
	}

	public function scan_directories() {
		$backup = $this->get_running_backup();

		if ( ! $backup || is_wp_error( $backup ) ) {
			return $backup;
		}

		global $scanned_dirs_count;
		global $scanned_files_count;

		$scanned_dirs_count = 0;
		$scanned_files_count = 0;

		$begin = microtime( true );
		list( $hash, $children ) = $this->get_directory_hash_and_children( ABSPATH );
		echo "Scan duration: ".(microtime(true)-$begin)." seconds\n";
		echo "Scanned $scanned_dirs_count directories and $scanned_files_count files\n";
		// print_r($children);

		// flatten hash and send to server for comparison
		// perhaps we should send the tree, so the server can also confirm that the files have the same
		// names, and also do security scanning, e.g. be aware which files should _not_ have had their hashes modified?
		// but for now let's go with the naive, compact, stateless approach...
		$keys = $this->get_all_child_hashes( $children );
		// print_r($keys);
		echo "JSON size: ".strlen(json_encode($keys))."\n";

		return $keys;
	}

	/**
	 * Find out which of my hashes are already present on the server
	 */
	public function check_server( $keys ) {
		Jetpack::load_xml_rpc_client();

		$query_args = array( 'timeout' => 60 );
		$url = add_query_arg( $query_args, Jetpack::xmlrpc_api_url() );
		$rpc = new Jetpack_IXR_Client( array(
			'url'     => $url,
			'user_id' => JETPACK_MASTER_USER,
			'timeout' => $query_args['timeout'],
		) );

		$response = array();
		error_log("contacting server at $url");
		$start = microtime( true );
		foreach( array_chunk( $keys, 100 ) as $keys_chunk ) {
			$result = $rpc->query( 'jetpack.checkFiles', $keys_chunk );
			error_log("received response for " . count($keys_chunk) . " keys in ".(microtime(true)-$start)." seconds");
			if ( ! $result ) {
				return $rpc->get_jetpack_error();
			}
			// queue up any files that are missing
			$hashes_to_upload = $rpc->getResponse();
		}

		return $response;
	}

	/**
	 * Recursively flattens the directory hierarchy into a simple array of hashes to
	 * check against the server
	 */
	private function get_all_child_hashes( $directory, &$hashes = array() ) {
		foreach ( $directory as $filename => $hash_or_children ) {
			if ( is_scalar( $hash_or_children ) ) {
				$hashes[] = $hash_or_children;
			} else {
				$hashes[] = $hash_or_children['hash'];
				$this->get_all_child_hashes( $hash_or_children['children'], $hashes );
			}
		}
		return $hashes;
	}

	/**
	 * Recursively fetches the hash of a directory and all its children, except certain blacklisted directories
	 */
	private function get_directory_hash_and_children( $path ) {
		$children = array();

		// normalize path
		if ( $path[ strlen( $path ) - 1 ] !== DIRECTORY_SEPARATOR ) {
			$path .= DIRECTORY_SEPARATOR;
		}

		// we concatenate hashes of all files and subdirs to generate
		// a unique hash for this directory
		$directory_hash_content = '';

		// NOTE a directory's mtime is changed when a file is added or removed, but NOT when it's changed.
		// - useful!
		// ... but can be faked :( and so should not be trusted?
		$files = scandir( $path ); // we use scandir rather than opendir because it sorts alphabetically

		global $scanned_dirs_count;
		global $scanned_files_count;

		foreach( $files as $entry ) {
			$fullpath = $path . $entry;
			if ( is_dir( $fullpath )
				&& $entry != '.'
				&& $entry != '..'
				&& $entry != 'node_modules' // TODO: make configurable
				&& $entry[0] != '.' ) {     // is this desirable? can we miss files necessary for the site to function this way?
				$scanned_dirs_count += 1;
				list( $hash, $subchildren ) = $this->get_directory_hash_and_children( $fullpath );
				$children[$entry] = array(
					'hash' => $hash,
					'children' => $subchildren
				);
				$directory_hash_content .= $hash;
				continue;
			}

			if ( is_file( $fullpath ) && $entry[0] != '.' ) {
				$scanned_files_count += 1;
				$hash = $this->get_file_hash( $fullpath );
				$children[$entry] = $hash;
				$directory_hash_content .= $hash;
			}
		}
		return array( sha1( $directory_hash_content ), $children );
	}

	/**
	 * Generates a hash for a file as quickly as possible
	 * It does this by only hashing the first FILE_HASH_SIZE bytes of the file and, if
	 * the file size is > FILE_HASH_SIZE bytes, also the last FILE_HASH_SIZE bytes of the
	 * file, or ( $filesize - FILE_HASH_SIZE ) bytes, if that is smaller.
	 *
	 * It includes the full path in the hash, minus ABSPATH, since the same file often ends up
	 * in different parts of the tree.
	 * TODO: test and account for 32 bit precision http://php.net/manual/en/function.filesize.php#121406
	 */
	private function get_file_hash( $fullpath ) {
		$filehandle = fopen( $fullpath, 'r' );
		if ( ! $filehandle ) {
			return false;
		}

		$firstPart = fread( $filehandle, self::FILE_HASH_SIZE );

		// if the bytes retrieved is < self::FILE_HASH_SIZE, just return, otherwise also load the last self::FILE_HASH_SIZE bytes
		// to maximise the chance of picking up changes
		if ( strlen( $firstPart ) <= self::FILE_HASH_SIZE ) {
			fclose( $filehandle );
			return sha1( $firstPart );
		}

		// calculate how much more of the file to read. Note that fseek uses INT internally so files > 2GB in size
		// will break on 32 bit PHP builds
		$lastPartBytesToRead = self::FILE_HASH_SIZE;
		$filesize = filesize( $fullpath );

		// avoid reading overlapping bytes with the first hash, if the file is smaller than 2*FILE_HASH_SIZE
		if ( $filesize < 2*self::FILE_HASH_SIZE ) {
			$lastPartBytesToRead = $filesize - self::FILE_HASH_SIZE;
		}

		fseek($filehandle, -$lastPartBytesToRead);

		$lastPart = fread( $filehandle, $lastPartBytesToRead );

		fclose( $filehandle );
		return sha1( $firstPart . $lastPart );
	}
}

add_action( 'init', array('Jetpack_Sync_Files', 'get_instance' ) );