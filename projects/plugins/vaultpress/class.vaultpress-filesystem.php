<?php
// don't call the file directly
defined( 'ABSPATH' ) or die();

class VaultPress_Filesystem {

	var $type = null;
	var $dir  = null;
	var $keys = array( 'ino', 'uid', 'gid', 'size', 'mtime', 'blksize', 'blocks' );

	function __construct() {
	}

	function want( $type ) {
		$vp = VaultPress::init();

		if ( $type == 'plugins' ) {
			$this->dir = realpath( $vp->resolve_content_dir() . 'plugins' );
			$this->type = 'p';
			return true;
		}
		if ( $type == 'themes' ) {
			$this->dir = realpath( $vp->resolve_content_dir() . 'themes' );
			$this->type = 't';
			return true;
		}
		if ( $type == 'uploads' ) {
			$this->dir = realpath( $vp->resolve_upload_path() );
			$this->type = 'u';
			return true;
		}
		if ( $type == 'content' ) {
			$this->dir = realpath( $vp->resolve_content_dir() );
			$this->type = 'c';
			return true;
		}
		if ( $type == 'root' ) {
			$this->dir = realpath( ABSPATH );
			$this->type = 'r';
			return true;
		}
		die( 'naughty naughty' );
	}

	function fdump( $file ) {
		header("Content-Type: application/octet-stream;");
		header("Content-Transfer-Encoding: binary");
		@ob_end_clean();
		if ( !file_exists( $file ) || !is_readable( $file ) ) {
			$file_name = basename( $file );
			if ( 'wp-config.php' == $file_name ) {
				$dir = dirname( $file );
				$dir = explode( DIRECTORY_SEPARATOR, $dir );
				array_pop( $dir );
				$dir = implode( DIRECTORY_SEPARATOR, $dir );
				$file = trailingslashit( $dir ) . $file_name;
				if ( !file_exists( $file ) || !is_readable( $file ) )
					die( "no such file" );
			} else {
				die( "no such file" );
			}
		}
		if ( !is_file( $file ) && !is_link( $file ) )
			die( "can only dump files" );
		$fp = @fopen( $file, 'rb' );
		if ( !$fp )
			die( "could not open file" );
		while ( !feof( $fp ) )
			echo @fread( $fp, 8192 );
		@fclose( $fp );
		die();
	}

	function exec_checksum( $file, $method ) {
		if ( !function_exists( 'exec' ) )
			return false;
		$out = array();
		if ( 'md5' == $method )
			$method_bin = 'md5sum';
		if ( 'sha1' == $method )
			$method_bin = 'sha1sum';
		$checksum = '';
		exec( sprintf( '%s %s', escapeshellcmd( $method_bin ), escapeshellarg( $file ) ), $out );
		if ( !empty( $out ) )
			$checksum = trim( array_shift( explode( ' ', array_pop( $out ) ) ) );
		if ( !empty( $checksum ) )
			return $checksum;
		return false;
	}

	function checksum_file( $file, $method ) {
		$use_exec = false;
		if ( filesize( $file ) >= 104857600 )
			$use_exec = true;
		switch( $method ) {
			case 'md5':
			if ( $use_exec ) {
				$checksum = $this->exec_checksum( $file, $method );
				if ( !empty( $checksum ) )
					return $checksum;
			}
			return md5_file( $file );
			break;
			case 'sha1':
			if ( $use_exec ) {
				$checksum = $this->exec_checksum( $file, $method );
				if ( !empty( $checksum ) )
					return $checksum;
			}
			return sha1_file( $file );
			break;
			default:
			return false;
			break;
		}
	}

	function stat( $file, $md5=true, $sha1=true ) {
		if ( ! file_exists( $file ) )
			return false;
		
		$rval = array();
		foreach ( stat( $file ) as $i => $v ) {
			if ( is_numeric( $i ) )
				continue;
			$rval[$i] = $v;
		}
		$rval['type'] = filetype( $file );
		if ( $rval['type'] == 'file' ) {
			if ( $md5 )
				$rval['md5'] = $this->checksum_file( $file, 'md5' );
			if ( $sha1 )
				$rval['sha1'] = $this->checksum_file( $file, 'sha1' );
		}
		$dir = $this->dir;
		if ( 0 !== strpos( $file, $dir ) && 'wp-config.php' == basename( $file ) ) {
			$dir = explode( DIRECTORY_SEPARATOR, $dir );
			array_pop( $dir );
			$dir = implode( DIRECTORY_SEPARATOR, $dir );
		}
		$rval['full_path'] = realpath( $file );
		
		//	Avoid rebuilding path tidy-up regex when fetching multiple entries
		static $last_dir = null;
		static $dir_regex = null;
		if ( $last_dir !== $dir ) {
			$dir_regex = '#' . preg_quote( $dir ) . '#';
			$last_dir = $dir;
		}
		
		$rval['path'] = preg_replace( $dir_regex, '', $file, 1 );
		return $rval;
	}

	function ls( $what, $md5=false, $sha1=false, $limit=null, $offset=null, $full_list=false ) {
		clearstatcache();
		$path = realpath($this->dir . $what);
		$dir = $this->dir;
		if ( !$path && '/wp-config.php' == $what ) {
			$dir = explode( DIRECTORY_SEPARATOR, $dir );
			array_pop( $dir );
			$dir = implode( DIRECTORY_SEPARATOR, $dir );
			$path = realpath( $dir . $what );
		}
		if ( is_file($path) )
			return $this->stat( $path, $md5, $sha1 );
		if ( is_dir($path) ) {
			$entries = array();
			$current = 0;
			$offset = (int)$offset;
			$orig_limit = (int)$limit;
			$limit = $offset + (int)$limit;
			foreach ( (array)$this->scan_dir( $path ) as $i ) {
				if ( !$full_list && !$this->should_backup_file( $i ) )
					continue;
				$current++;
				if ( $offset >= $current )
					continue;
				if ( $limit && $limit < $current )
					break;

				// don't sha1 files over 100MB if we are batching due to memory consumption
				if ( $sha1 && $orig_limit > 1 && is_file( $i ) && (int)@filesize( $i ) > 104857600 )
					$sha1 = false;

				$entries[] = $this->stat( $i, $md5, $sha1 );
			}
			return $entries;
		}
	}

	function should_backup_file( $filepath ) {
		$vp = VaultPress::init();
		if ( is_dir( $filepath ) )
			$filepath = trailingslashit( $filepath );
		$regex_patterns = $vp->get_should_ignore_files();
		foreach ( $regex_patterns as $pattern ) {
			$matches = array();
			if ( preg_match( $pattern, $filepath, $matches ) ) {
				return false;
			}
		}
		return true;
	}

	function validate( $file ) {
		$rpath = realpath( $this->dir.$file );
		$dir = $this->dir;
		if ( !$rpath && '/wp-config.php' == $file ) {
			$dir = explode( DIRECTORY_SEPARATOR, $dir );
			array_pop( $dir );
			$dir = implode( DIRECTORY_SEPARATOR, $dir );
			$rpath = realpath( $dir . $file );
		}
		if ( !$rpath )
			die( serialize( array( 'type' => 'null', 'path' => $file ) ) );
		if ( is_dir( $rpath ) )
			$rpath = "$rpath/";
		if ( strpos( $rpath, $dir ) !== 0 )
			return false;
		return true;
	}

	function dir_examine( $subdir='', $recursive=true, $origin=false ) {
		$res = array();
		if ( !$subdir )
			$subdir='/';
		$dir = $this->dir . $subdir;
		if ( $origin === false )
			$origin = $this->dir . $subdir;
		if ( is_file($dir) ) {
			if ( $origin ==  $dir )
				$name = str_replace( $this->dir, '/', $subdir );
			else
				$name = str_replace( $origin, '/', $dir );
			$res[$name] = $this->stat( $dir.$entry );
			return $res;
		}
		$d = dir( $dir );
		if ( !$d )
			return $res;
		while ( false !== ( $entry = $d->read() ) ) {
			$rpath = realpath( $dir.$entry );
			$bname = basename( $rpath );
			if ( is_link( $dir.$entry ) )
				continue;
			if ( $entry == '.' || $entry == '..' || $entry == '...' )
				continue;
			if ( !$this->validate( $subdir.$entry ) )
				continue;
			$name = str_replace( $origin, '/', $dir.$entry );
			$res[$name] = $this->stat( $dir.$entry );
			if ( $recursive && is_dir( $this->dir.$subdir.'/'.$entry ) ) {
				$res = array_merge( $res, $this->dir_examine( $subdir.$entry.'/', $recursive, $origin ) );
			}
		}
		return $res;
	}

	function dir_checksum( $base, &$list, $recursive=true ) {
		if ( $list == null )
			$list = array();

		if ( 0 !== strpos( $base, $this->dir ) )
			$base = $this->dir . rtrim( $base, '/' );

		$shortbase = substr( $base, strlen( $this->dir ) );
		if ( !$shortbase )
			$shortbase = '/';
		$stat = stat( $base );
		$directories = array();
		$files = (array)$this->scan_dir( $base );
		array_push( $files, $base );
		foreach ( $files as $file ) {
			if ( $file !== $base && @is_dir( $file ) ) {
				$directories[] = $file;
				continue;
			}
			$stat = @stat( $file );
			if ( !$stat )
				continue;
			$shortstat = array();
			foreach( $this->keys as $key ) {
				if ( isset( $stat[$key] ) )
					$shortstat[$key] = $stat[$key];
			}
			$list[$shortbase][basename( $file )] = $shortstat;
		}
		$list[$shortbase] = md5( serialize( $list[$shortbase] ) );
		if ( !$recursive )
			return $list;
		foreach ( $directories as $dir ) {
			$this->dir_checksum( $dir, $list, $recursive );
		}
		return $list;
	}

	function scan_dir( $path ) {
		$files = array();

		if ( false === is_readable( $path ) ) {
			return array();
		}

		$dh = opendir( $path );

		if ( false === $dh ) {
			return array();
		}

		while ( false !== ( $file = readdir( $dh ) ) ) {
			if ( $file == '.' || $file == '..' ) continue;
			$files[] = "$path/$file";
		}

		closedir( $dh );
		sort( $files );
		return $files;
	}
}
