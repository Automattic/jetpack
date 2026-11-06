<?php
/**
 * Load the Features provider from a physical plugin for a bulk REST request.
 * WP_PLUGIN_DIR must point at the temporary plugins before WordPress loads,
 * which the shared bootstrap and #[RunInSeparateProcess] cannot do.
 *
 * @package automattic/my-jetpack
 */

use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\My_Jetpack\Main_Features;

$plugins_dir = sys_get_temp_dir() . '/my-jetpack-bulk-' . bin2hex( random_bytes( 8 ) );
try {
	mkdir( $plugins_dir );
	$plugins_dir = realpath( $plugins_dir );
	define( 'WP_PLUGIN_DIR', $plugins_dir );
	require __DIR__ . '/../bootstrap.php';

	$versions = array(
		'jetpack'            => '6.8.0.1',
		'jetpack-boost'      => '6.15.0',
		'jetpack-videopress' => '6.15.0',
	);
	if ( 'jetpack-and-host' === $argv[1] ) {
		$versions['jetpack']       = '6.15.0';
		$versions['jetpack-boost'] = '6.7.0';
	}
	$active = array();
	foreach ( $versions as $folder => $version ) {
		$src = $plugins_dir . '/' . $folder . '/jetpack_vendor/automattic/jetpack-my-jetpack/src';
		mkdir( $src, 0777, true );
		file_put_contents( $src . '/class-initializer.php', "<?php class Initializer { const PACKAGE_VERSION = '$version'; }" );
		$file = $folder . '/' . $folder . '.php';
		copy( __DIR__ . '/../assets/' . str_replace( 'jetpack-', '', $folder ) . '-mock-plugin.txt', $plugins_dir . '/' . $file );
		$active[] = $file;
	}
	$host_src = $plugins_dir . '/jetpack-videopress/jetpack_vendor/automattic/jetpack-my-jetpack/src/class-main-features.php';
	copy( __DIR__ . '/../../../src/class-main-features.php', $host_src );
	require $host_src;
	update_option( 'active_plugins', $active );
	wp_cache_delete( 'plugins', 'plugins' );
	add_filter( 'jetpack_offline_mode', '__return_true' );
	wp_set_current_user(
		wp_insert_user(
			array(
				'user_login' => 'bulk_admin',
				'user_pass'  => 'test',
				'role'       => 'administrator',
			)
		)
	);
	$GLOBALS['wp_rest_server'] = new WP_REST_Server();
	Initializer::init();
	do_action( 'rest_api_init' );
	$plugins = array( 'jetpack-videopress', 'jetpack-boost' );
	if ( 'jetpack-and-host' === $argv[1] ) {
		$plugins = array( 'jetpack', 'jetpack-videopress' );
	}
	$request = new WP_REST_Request( 'POST', '/wpcom/v2/my-jetpack/site/features/bulk' );
	$request->set_header( 'Content-Type', 'application/json' );
	$request->set_body(
		wp_json_encode(
			array(
				'active'  => false,
				'plugins' => $plugins,
			),
			JSON_UNESCAPED_SLASHES
		)
	);
	$response = rest_get_server()->dispatch( $request );
	echo wp_json_encode(
		array(
			'host'   => Main_Features::get_hosting_plugin_slug(),
			'status' => $response->get_status(),
			'failed' => $response->get_data()['failed'],
			'active' => get_option( 'active_plugins' ),
		),
		JSON_UNESCAPED_SLASHES
	);
} finally {
	$files = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $plugins_dir, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
	foreach ( $files as $file ) {
		if ( $file->isDir() ) {
			rmdir( $file->getPathname() );
		} else {
			unlink( $file->getPathname() );
		}
	}
	rmdir( $plugins_dir );
}
