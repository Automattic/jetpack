<?php

/**
 * Testing CRUD on Options
 */
class WP_Test_Jetpack_Sync_Themes extends WP_Test_Jetpack_Sync_Base {
	protected $theme;

	public function setUp() {
		parent::setUp();
		$themes = array( 'twentyten', 'twentyeleven', 'twentytwelve', 'thwentythirteen', 'twentyfourteen' );
		$this->theme = $themes[ rand( 0, 4 ) ];

		switch_theme( $this->theme );

		$this->sender->do_sync();
	}

	public function test_changed_theme_is_synced() {
		$theme_features = array( 'post-thumbnails', 'post-formats', 'custom-header', 'custom-background',
			'custom-logo', 'menus', 'automatic-feed-links', 'editor-style', 'widgets', 'html5', 'title-tag',
			'jetpack-social-menu', 'jetpack-responsive-videos', 'infinite-scroll', 'site-logo' );

		foreach ( $theme_features as $theme_feature ) {
			$synced_theme_support_value = $this->server_replica_storage->current_theme_supports( $theme_feature );
			$this->assertEquals( current_theme_supports( $theme_feature ), $synced_theme_support_value, 'Feature(s) not synced'. $theme_feature );
		}

		// TODO: content_width - this has traditionally been synced as if it was a theme-specific
		// value, but in fact it's a per-page/post value defined via Jetpack's Custom CSS module

		// LEFT OUT: featured_images_enabled - a quick look inside Jetpack shows that this is equivalent
		// to 'post-thumbnails', so not worth syncing

		// theme name and options should be whitelisted as a synced option
		$this->assertEquals( $this->theme,  $this->server_replica_storage->get_option( 'stylesheet' ) );
		$this->assertEquals( get_option( 'theme_mods_'. $this->theme ),  $this->server_replica_storage->get_option( 'theme_mods_'.$this->theme ) );
	}
}
