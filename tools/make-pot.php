<?php

/**
 * Generates POT File for Jetpack
 *
 * php makepot DIRECTORY [OUTPUT=jetpack.pot]
 */

function jetpack_make_pot_usage() {
	global $argv;

	die( "$argv[0] DIRECTORY [OUTPUT=jetpack.pot]\n" );
}

defined( 'WORDPRESS_I18N__MAKEPOT_PATH' ) or define( 'WORDPRESS_I18N__MAKEPOT_PATH', dirname( __FILE__ ) . '/wordpress-i18n/makepot.php' );

if ( !WORDPRESS_I18N__MAKEPOT_PATH || !is_file( WORDPRESS_I18N__MAKEPOT_PATH ) ) {
	jetpack_make_pot_usage();
}

require WORDPRESS_I18N__MAKEPOT_PATH;

class Jetpack_MakePOT extends MakePOT {
	function __construct() {
		$this->projects[] = 'jetpack';
		parent::__construct();
	}

	function jetpack( $dir, $output ) {
		$main_file = "$dir/jetpack.php";
		$source = $this->get_first_lines( $main_file, $this->max_header_lines );

		$placeholders = array(
			'version' => $this->get_addon_header( 'Version', $source ),
			'author'  => $this->get_addon_header( 'Author', $source ),
			'name'    => $this->get_addon_header( 'Plugin Name', $source ),
			'slug'    => 'jetpack',
		);

		if ( !$res = $this->xgettext( 'wp-plugin', $dir, $output, $placeholders ) ) {
			return false;
		}

		$potextmeta = new PotExtMeta;
		$res = $potextmeta->append( $main_file, $output );

		$modules = glob( "$dir/modules/*.php" ); /* */
		foreach ( $modules as $module ) {
			$potextmeta = new Jetpack_PotExtMeta;
			$potextmeta->append( $module, $output );
		}

		/* Adding non-gettexted strings can repeat some phrases */
		$output_shell = escapeshellarg($output);
		system( "msguniq $output_shell -o $output_shell" );
		return $res;
	}
}

class Jetpack_PotExtMeta extends PotExtMeta {
	var $headers = array(
		'Module Name',
		'Module Description',
	);
}


// run the CLI only if the file
// wasn't included
$included_files = get_included_files();
if ( __FILE__ == $included_files[0] ) {
	$makepot = new Jetpack_MakePOT;
	if ( empty( $argv[1] ) ) {
		jetpack_makepot_usage();
	}

	if ( ( !$realpath = realpath( $argv[1] ) ) || !is_dir( $realpath ) ) {
		jetpack_makepot_usage();
	}

	$res = $makepot->jetpack( $realpath, isset( $argv[2] )? $argv[2] : 'jetpack.pot' );
	if ( false === $res ) {
		fwrite(STDERR, "Couldn't generate POT file!\n");
	} 
}
