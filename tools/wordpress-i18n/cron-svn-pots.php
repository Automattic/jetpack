<?php
require_once dirname( __FILE__ ) . '/makepot.php';

function silent_system( $command ) {
	global $at_least_one_error;	
	ob_start();
	system( "$command 2>&1", $exit_code );
	$output = ob_get_contents();
	ob_end_clean();
	if ( $exit_code != 0 ) {
		echo "ERROR:\t$command\nCODE:\t$exit_code\nOUTPUT:\n";
		echo $output."\n";
	} else {
		echo "OK:\t$command\n";		
	}	
	return $exit_code;
}


$options = getopt( 'c:p:m:n:sa:b:u:w:df' );
if ( empty( $options ) ) {
?>
	-s	No branch/version directories, it's all flat
	-c	Application svn checkout
	-p	POT svn checkout
	-m	MakePOT project
	-n	POT filename
	-a	Relative path of application inside version dir in -c
	-b	Relative patch of POT dir inside version dir in -p
	-u	SVN username (optional)
	-w	SVN password (optional)
	-d	Dry-run
	-f	Fast - do not update checkouts
<?php
	die;
}

$application_svn_checkout = realpath( $options['c'] );
$pot_svn_checkout = realpath( $options['p'] );
$makepot_project = str_replace( '-', '_', $options['m'] );
$pot_name = $options['n'];
$no_branch_dirs = isset( $options['s'] );
$relative_application_path = isset( $options['a'] )? '/'.$options['a'] : '';
$relative_pot_path = isset( $options['b'] )? '/'.$options['b'] : '';
$dry_run = isset( $options['d'] );

$makepot = new MakePOT;
$svn_args = array('--non-interactive');
if ( isset( $options['u'] ) && isset( $options['w'] ) ) {
	$svn_args[] = '--username='.$options['u'];
	$svn_args[] = '--password='.$options['w'];
	$svn_args[] = '--no-auth-cache';
}
$svn_args_str = implode( ' ', array_map( 'escapeshellarg', $svn_args ) );
$svn = 'svn '.$svn_args_str;


$versions = array();

chdir( $application_svn_checkout );
if ( ! isset( $options['f'] ) ) {
	$exit = silent_system( "$svn cleanup" );
	if ( 0 != $exit ) die();
	$exit = silent_system( "$svn up" );
	if ( 0 != $exit ) die();
}
if ( is_dir( 'trunk' ) ) $versions[] = 'trunk';
$branches = glob( 'branches/*' );
if ( false !== $branches ) $versions = array_merge( $versions, $branches );
$tags = glob( 'tags/*' );
if ( false !== $tags ) $versions = array_merge( $versions, $tags );

if ( $no_branch_dirs ) {
	$versions = array( '.' );
}

chdir( $pot_svn_checkout );
if ( $application_svn_checkout != $pot_svn_checkout && ! isset( $options['f'] ) ) {
	$exit = silent_system( "$svn cleanup" );
	if ( 0 != $exit ) die();
	$exit = silent_system( "$svn up" );
	if ( 0 != $exit ) die();
}
$real_application_svn_checkout = realpath( $application_svn_checkout );
foreach( $versions as $version ) {
	$application_path = "$real_application_svn_checkout/$version{$relative_application_path}";
	if ( !is_dir( $application_path ) ) continue;
	$pot = "$version{$relative_pot_path}/$pot_name";
	$exists = is_file( $pot );
	// do not update old tag pots
	if ( 'tags/' == substr( $version, 0, 5 ) && $exists ) continue;
	if ( !is_dir( $version ) ) {
		$exit = silent_system( "$svn mkdir $version" );
		if ( 0 != $exit ) continue;
	}
	if ( !is_dir(dirname("$pot_svn_checkout/$pot")) ) continue;
	if ( !call_user_func( array( &$makepot, $makepot_project ), $application_path, "$pot_svn_checkout/$pot" ) ) continue;
	if ( !file_exists( "$pot_svn_checkout/$pot" ) ) continue; 
	if ( !$exists ) {
		$exit = silent_system( "$svn add $pot" );
		if ( 0 != $exit ) continue;
	}
	// do not commit if the difference is only in the header, but always commit a new file
	$real_differences = `svn diff $pot | wc -l` > 16;
	$target = $exists ? $pot : $version;
	if ( !$exists || $real_differences ) {
		preg_match( '/Revision:\s+(\d+)/', `svn info $application_path`, $matches );
		$logmsg = isset( $matches[1] ) && intval( $matches[1] )? "POT, generated from r".intval( $matches[1] ) : 'Automatic POT update';
		$command = "$svn ci $target --non-interactive --message='$logmsg'";
		if ( !$dry_run )
			silent_system( $command );
		else
			echo "CMD:\t$command\n";
	} else {
		silent_system( "$svn revert $target" );
	}
}
