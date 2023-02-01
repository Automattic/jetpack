<?php

require_once __DIR__ . '/../dependency-path-mapping.php';

class Test_URL_To_File_Mapping extends PHPUnit\Framework\TestCase {
	// TODO: URL without host is based on ABSPATH
	// TODO: Separate plugin URL with site URL host. Exist/non-exist
	// TODO: Separate content URL with site URL host. Exist/non-exist
	// TODO: Site root URL. Exist/non-exist
	// TODO: Plugin URL under content URL dir but separate from site URL. Same host as site URL.
	// TODO: Plugin URL under content URL which is under site URL. Same host as site URL.
	// TODO: Content URL descended from site URL
	// TODO: Plugin URL with different host than site URL
	// TODO: Content URL with different host than site URL
	// TODO: Relative URLs

	function test_abspath_resolution() {
		$site_url = 'https://example.com/site';
		$site_dir = __DIR__ . '/data/url-to-file-mapping/site';
		$content_url = 'https://example.com/site/wp-content';
		$content_dir = "$site_dir/content";
		$plugin_url = 'https://example.com/site/wp-content/plugins';
		$plugin_dir = "$content_dir/plugin";

		$dpm = new Page_Optimize_Dependency_Path_Mapping(
			$site_url,
			$site_dir,
			$content_url,
			$content_dir,
			$plugin_url,
			$plugin_dir
		);

		// TODO: Remove this call to realpath() when we fix dependency_src_to_fs_path() to stop doubling path separators
		$this->assertEquals( "$site_dir/exists", realpath( $dpm->dependency_src_to_fs_path( '/exists' ) ) );
		$this->assertFalse( $dpm->dependency_src_to_fs_path( '/nonexistent' ) );
	}
}

class Test_URI_Path_To_File_Mapping extends PHPUnit\Framework\TestCase {

	// TODO: Test URI and FS paths with and without trailing slashes

	/**
	 * @dataProvider provide_test_data
	 * @test
	 */
	function run_test(
		$label,
		$site_host,
		$site_uri_path,
		$site_dir,
		$content_host,
		$content_uri_path,
		$content_dir,
		$plugin_host,
		$plugin_uri_path,
		$plugin_dir
	) {
		$site_url = "{$site_host}{$site_uri_path}";
		$content_url = "{$content_host}{$content_uri_path}";
		$plugin_url = "{$plugin_host}{$plugin_uri_path}";

		$root = __DIR__ . '/data/url-to-file-mapping';
		$site_dir = "{$root}{$site_dir}";
		$content_dir = "{$root}{$content_dir}";
		$plugin_dir = "{$root}{$plugin_dir}";

		$dpm = new Page_Optimize_Dependency_Path_Mapping(
			$site_url,
			$site_dir,
			$content_url,
			$content_dir,
			$plugin_url,
			$plugin_dir
		);

		$this->assertEquals( "$site_dir/exists", $dpm->uri_path_to_fs_path( "$site_uri_path/exists" ), "$label: Cannot find file based on site URI path" );
		$this->assertFalse( $dpm->uri_path_to_fs_path( "$site_uri_path/nonexistent" ), "$label: Should have failed for nonexistent file based on site URI path" );

		$actual_content_path = $dpm->uri_path_to_fs_path( "$content_uri_path/exists" );
		if ( 0 === strpos( $content_url, $site_url ) ) {
			// Content is under site URL. We expect this path to resolve.
			$this->assertEquals( "$content_dir/exists", $actual_content_path, "$label: Cannot find file based on content URI path" );
		} else {
			// Content is not under site URL. We expect a resolution failure.
			$this->assertFalse( $actual_content_path, "$label: Should have failed for content URI path outside of site URL" );
		}
		$this->assertFalse( $dpm->uri_path_to_fs_path( "$content_uri_path/nonexistent" ), "$label: Should have failed for nonexistent file based on content URI path" );

		$actual_plugin_path = $dpm->uri_path_to_fs_path( "$plugin_uri_path/exists" );
		if ( 0 === strpos( $plugin_url, $site_url ) ) {
			// Plugins are under site URL. We expect this path to resolve.
			$this->assertEquals( "$plugin_dir/exists", $actual_plugin_path, "$label: Cannot find file based on plugin URI path" );
		} else {
			// Plugins are not under site URL. We expect a resolution failure.
			$this->assertFalse( $actual_plugin_path, "$label: Should have failed for plugin URI path outside of site URL" );
		}
		$this->assertFalse( $dpm->uri_path_to_fs_path( "$plugin_uri_path/nonexistent" ), "$label: Should have failed for nonexistent file based on plugin URI path" );
	}

	function provide_test_data() {
		return array(
			array(
				'Nested site->content->plugin dirs',
				'https://example.com',
				'/subdir',
				'/site',
				'https://example.com',
				'/subdir/wp-content',
				'/site/content',
				'https://example.com',
				'/subdir/wp-content/plugins',
				'/site/content/plugins',
			),
			array(
				'Nested content->plugin dirs, separate from ABSPATH',
				'https://example.com',
				'/subdir',
				'/site',
				'https://example.com',
				'/subdir/wp-content',
				'/content',
				'https://example.com',
				'/subdir/wp-content/plugins',
				'/content/plugins'
			),
			array(
				'Content and plugin dirs separate from ABSPATH and each other',
				'https://example.com',
				'/subdir',
				'/site',
				'https://example.com',
				'/subdir/wp-content',
				'/content',
				'https://example.com',
				'/subdir/wp-content/plugins',
				'/plugins'
			),
			array(
				'Content and plugin URLs have same host but are not under the site URL',
				'https://example.com',
				'/subdir',
				'/site',
				'https://example.com',
				'/wp-content', // Not descended from site URL path
				'/site/content',
				'https://example.com',
				'/wp-content/plugins', // Not descended from site URL path
				'/site/content/plugins'
			),
			array(
				'Content and plugin URLs have different host from site URL',
				'https://example.com',
				'/subdir',
				'/site',
				'https://example.com:1234',
				'/subdir/wp-content',
				'/site/content',
				'https://other1.com',
				'/subdir/wp-content/plugins',
				'/site/content/plugins',
			),
		);
	}
}
