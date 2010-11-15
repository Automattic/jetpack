<html>
<head>
<title>WP Super Cache Uninstall Script</title>
</head>
<body>
<?php
/** Include the bootstrap for setting up WordPress environment */
if ( false == file_exists( './wp-load.php' ) ) {
	die( 'This file must be copied into the same directory where WordPress is installed. The file wp-load.php is in this directory' );
}
include( './wp-load.php' );

if ( !is_user_logged_in() )
	wp_die( 'You must be logged in to run this script.' );

if ( !current_user_can( 'install_plugins' ) )
	wp_die( 'You do not have permission to run this script.' );

?>
<p>This script will uninstall the files and directories created by <a href='http://ocaoimh.ie/wp-super-cache/'>WP Super Cache</a>.</p>
<?php
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

if ( $_POST[ 'uninstall' ] ) {
	$valid_nonce = isset($_REQUEST['_wpnonce']) ? wp_verify_nonce( $_REQUEST['_wpnonce'], 'wp-cache' . $current_user->ID ) : false;
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
	$permission_problem = false;
	echo "Removing " . WP_CONTENT_DIR . "/advanced-cache.php :";
	if ( false == @unlink( WP_CONTENT_DIR . "/advanced-cache.php" ) ) {
		$permission_problem = true;
		echo " <strong>FAILED</strong><br />";
	} else {
		echo " <strong>DONE</strong><br />";
	}
	echo "Removing " . WP_CONTENT_DIR . "/wp-cache-config.php :";
	if ( false == unlink( WP_CONTENT_DIR . "/wp-cache-config.php" ) ) {
		$permission_problem = true;
		echo " <strong>FAILED</strong><br />";
	} else {
		echo " <strong>DONE</strong><br />";
	}
	if ( $permission_problem ) {
		wp_die( "One or more files could not be deleted. " . WP_CONTENT_DIR . " must be made writeable:<br /><code>chmod 777 " . WP_CONTENT_DIR . "</code><br /><br /> and don't forgot to fix things later:<br /><code>chmod 755 " . WP_CONTENT_DIR . "</code><br /><br />" );
	}
	echo "<p>Make sure you remove the following line from " . ABSPATH . "wp-config.php too.</p>";
	echo "<blockquote><code>define('WP_CACHE', true);</code></blockquote>";
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
	<?php wp_nonce_field( 'wp-cache' . $current_user->ID ); ?>
	<input type='hidden' name='uninstall' value='1' />
	<input type='submit' value='UNINSTALL' />
	</form>
	<?php
}

?>
</body>
</html>
