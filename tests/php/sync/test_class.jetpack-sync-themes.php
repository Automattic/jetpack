<?php

/**
 * Testing CRUD on Options
 */
class WP_Test_Jetpack_Sync_Themes extends WP_Test_Jetpack_Sync_Base {
	protected $theme;

	public function setUp() {
		parent::setUp();
		$themes      = array( 'twentyten', 'twentyeleven', 'twentytwelve', 'twentythirteen', 'twentyfourteen' );
		$this->theme = $themes[ rand( 0, 4 ) ];

		switch_theme( $this->theme );

		$this->sender->do_sync();
	}

	public function test_changed_theme_is_synced() {
		$theme_features = array(
			'post-thumbnails',
			'post-formats',
			'custom-header',
			'custom-background',
			'custom-logo',
			'menus',
			'automatic-feed-links',
			'editor-style',
			'widgets',
			'html5',
			'title-tag',
			'jetpack-social-menu',
			'jetpack-responsive-videos',
			'infinite-scroll',
			'site-logo'
		);

		// this forces theme mods to be saved as an option so that this test is valid
		set_theme_mod( 'foo', 'bar' );
		$this->sender->do_sync();

		foreach ( $theme_features as $theme_feature ) {
			$synced_theme_support_value = $this->server_replica_storage->current_theme_supports( $theme_feature );
			$this->assertEquals( current_theme_supports( $theme_feature ), $synced_theme_support_value, 'Feature(s) not synced' . $theme_feature );
		}

		// TODO: content_width - this has traditionally been synced as if it was a theme-specific
		// value, but in fact it's a per-page/post value defined via Jetpack's Custom CSS module

		// LEFT OUT: featured_images_enabled - a quick look inside Jetpack shows that this is equivalent
		// to 'post-thumbnails', so not worth syncing

		// theme name and options should be whitelisted as a synced option
		$this->assertEquals( $this->theme, $this->server_replica_storage->get_option( 'stylesheet' ) );

		$local_value = get_option( 'theme_mods_' . $this->theme );
		$remote_value = $this->server_replica_storage->get_option( 'theme_mods_' . $this->theme );
		
		if ( isset( $local_value[0] ) ) {
			// this is a spurious value that sometimes gets set during tests, and is
			// actively removed before sending to WPCOM
			// it appears to be due to a bug which sets array( false ) as the default value for theme_mods
			unset( $local_value[0] );
		}

		$this->assertEquals( $local_value, $this->server_replica_storage->get_option( 'theme_mods_' . $this->theme ) );
	}
}
