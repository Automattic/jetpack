<html>
<head>
<title>WP Super Cache Uninstall Script</title>
</head>
<body>
<?php
/** Include the bootstrap for setting up WordPress environment */
include( '../../../wp-load.php' );

if ( !is_user_logged_in() )
	wp_die( 'You must be logged in to run this script.' );

if ( !current_user_can( 'install_plugins' ) )
	wp_die( 'You do not have permission to run this script.' );

if ( defined( 'UNINSTALL_WPSUPERCACHE' ) )
	wp_die( 'UNINSTALL_WPSUPERCACHE set somewhere else! It must only be set in uninstall.php' );

define( 'UNINSTALL_WPSUPERCACHE', '' );

if ( !defined( 'UNINSTALL_WPSUPERCACHE' ) || constant( 'UNINSTALL_WPSUPERCACHE' ) == '' ) 
	wp_die( 'UNINSTALL_WPSUPERCACHE must be set to a non-blank value in uninstall.php' );

?>
<p>This script will uninstall the files and directories created by <a href='http://ocaoimh.ie/wp-super-cache/'>WP Super Cache</a>.</p>
<?php
if ( $_POST[ 'uninstall' ] ) {
	$plugins = (array)get_option( 'active_plugins' );
	$key = array_search( 'wp-super-cache/wp-cache.php', $plugins );
	if ( $key !== false ) {
		unset( $plugins[ $key ] );
		update_option( 'active_plugins', $plugins );
		echo "Disabled WP Super Cache plugin : <strong>DONE</strong><br />";
	}

	if ( in_array( 'wp-super-cache/wp-cache.php', get_option( 'active_plugins' ) ) )
		wp_die( 'WP Super Cache is still active. Please disable it on your plugins page first.' );
	echo "Removing " . WP_CONTENT_DIR . "/cache/ :";
	uninstall_supercache( WP_CONTENT_DIR . '/cache' );
	echo " <strong>DONE</strong><br />";
	echo "Removing " . WP_CONTENT_DIR . "/advanced-cache.php :";
	@unlink( WP_CONTENT_DIR . "/advanced-cache.php" );
	echo " <strong>DONE</strong><br />";
	echo "Removing " . WP_CONTENT_DIR . "/wp-cache-config.php :";
	@unlink( WP_CONTENT_DIR . "/wp-cache-config.php" );
	echo " <strong>DONE</strong><br />";
	echo "<p>Make sure you remove the following line from " . ABSPATH . "wp-config.php too.</p>";
	echo "<blockquote><code>define('WP_CACHE', true);</code></blockquote>";
	echo "<p><strong>Please comment out the UNINSTALL_WPSUPERCACHE <em>define()</em> in this file!</strong></p>";
	wp_mail( $current_user->user_email, 'WP Super Cache Uninstalled', '' );
} else {
	?>
	<form action='uninstall.php' method='POST'>
	<p>Click UNINSTALL to delete the following files and directories:
	<ol>
	<li> <?php echo WP_CONTENT_DIR . "/advanced-cache.php"; ?></li>
	<li> <?php echo WP_CONTENT_DIR . "/wp-cache-config.php"; ?></li>
	<li> <?php echo WP_CONTENT_DIR . '/cache'; ?></li>
	</ol>
	<input type='hidden' name='uninstall' value='1' />
	<input type='submit' value='UNINSTALL' />
	</form>
	<?php
}

function uninstall_supercache( $folderPath ) { // from http://www.php.net/manual/en/function.rmdir.php
	if ( trailingslashit( constant( 'ABSPATH' ) ) == trailingslashit( $folderPath ) )
		return false;
	if ( @is_dir ( $folderPath ) ) {
		$dh  = @opendir($folderPath);
		while( false !== ( $value = @readdir( $dh ) ) ) {
			if ( $value != "." && $value != ".." ) {
				$value = $folderPath . "/" . $value; 
				if ( @is_dir ( $value ) ) {
					uninstall_supercache( $value );
				} else {
					@unlink( $value );
				}
			}
		}
		return @rmdir( $folderPath );
	} else {
		return false;
	}
}
?>
</body>
</html>
