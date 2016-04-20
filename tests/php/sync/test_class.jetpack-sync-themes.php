<?php

/**
 * Testing CRUD on Options
 */
class WP_Test_Jetpack_New_Sync_Themes extends WP_Test_Jetpack_New_Sync_Base {
	protected $post;

	public function setUp() {
		parent::setUp();

		switch_theme( 'twentyfourteen' );

		$this->client->do_sync();
	}

	public function test_changed_theme_is_synced() {
		$theme_features = array( 'post-thumbnails', 'post-formats', 'custom-header', 'custom-background', 
			'custom-logo', 'menus', 'automatic-feed-links', 'editor-style', 'widgets', 'html5', 'title-tag', 
			'jetpack-social-menu', 'jetpack-responsive-videos', 'infinite-scroll', 'site-logo');

		foreach ( $theme_features as $theme_feature ) {
			$synced_theme_support_value = $this->server_replica_storage->current_theme_supports( $theme_feature );
			$this->assertEquals( current_theme_supports( $theme_feature ), $synced_theme_support_value );	
		}

		// TODO: content_width - this has traditionally been synced as if it was a theme-specific
		// value, but in fact it's a per-page/post value defined via Jetpack's Custom CSS module

		// LEFT OUT: featured_images_enabled - a quick look inside Jetpack shows that this is equivalent
		// to 'post-thumbnails', so not worth syncing

		// theme name and options should be whitelisted as a synced option
		$this->assertEquals( 'twentyfourteen',  $this->server_replica_storage->get_option( 'stylesheet' ) );
		$this->assertEquals( get_option( 'theme_mods_twentyfourteen' ),  $this->server_replica_storage->get_option( 'theme_mods_twentyfourteen' ) );
	}
}