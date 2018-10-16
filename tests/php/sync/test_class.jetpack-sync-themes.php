<?php
require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

//Mock object requiered for test_theme_update()
class Dummy_Sync_Test_WP_Upgrader {
	public $skin;

	public $result = true;

	public function __construct() {
		$this->skin = (object) array(
			'result' => true,
		);
	}

	function theme_info() {
		$reflection = new ReflectionClass("WP_Theme" );

		$instance = $reflection->newInstanceWithoutConstructor();

		$reflectionStyleProperty = $reflection->getProperty( 'stylesheet' );
		$reflectionStyleProperty->setAccessible( true ) ;
		$reflectionStyleProperty->setValue( $instance, 'foobar-theme' );
		return $instance;
	}
}

// Used to suppress echo'd output from Theme_Upgrader_Skin so that test_theme_install() will pass under Travis environments that failed because of output
class Test_Upgrader_Skin extends Theme_Upgrader_Skin {

	public function __construct($args = array()) {
		$defaults = array( 'url' => '', 'theme' => '', 'nonce' => '', 'title' => __('Update Theme') );
		$args = wp_parse_args($args, $defaults);
		$this->theme = $args['theme'];
		parent::__construct($args);
	}
	public function feedback($string) {}
	public function header() {}
	public function footer() {}
	public function decrement_update_count( $arg ) {}
}

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

		$current_theme = wp_get_theme();
		$switch_data = $this->server_event_storage->get_most_recent_event( 'jetpack_sync_current_theme_support' );
		$this->assertEquals( $current_theme->name, $switch_data->args[0]['name']);
		$this->assertEquals( $current_theme->version, $switch_data->args[0]['version']);

		$this->assertTrue( isset( $switch_data->args[1]['name'] ) );
		$this->assertTrue( isset( $switch_data->args[1]['version'] ) );
		$this->assertTrue( isset( $switch_data->args[1]['slug'] ) );
		$this->assertTrue( isset( $switch_data->args[1]['uri'] ) );

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

	public function test_network_enable_disable_theme_sync() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Run it in multi site mode' );
		}

		$test_themes = array(
			array(
				'twentyten',
				'Twenty Ten',
			),
			array(
				'twentytwelve',
				'Twenty Twelve',
			)
		);

		$themes = array(
			$test_themes[0][0] => 1,
			$test_themes[1][0] => 1,
		);

		$theme_slugs = array_keys( $themes );

		//Test enable multiple themes
		/**
		 * This filter is already documented in wp-includes/option.php
		 *
		 * Note that 'allowedthemes' is dynamic, i.e. do_action is called on "update_site_option_{$option}"
		 */
		do_action( 'update_site_option_allowedthemes', 'allowedthemes', $themes, array(), 0 );
		$this->sender->do_sync();
		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_network_enabled_themes' );
		$this->perform_network_enable_disable_assertions( $test_themes, $event_data, $theme_slugs );
		$this->server_event_storage->reset();

		//Test disable multiple themes
		/**
		 * This filter is already documented in wp-includes/option.php
		 *
		 * Note that 'allowedthemes' is dynamic, i.e. do_action is called on "update_site_option_{$option}"
		 */
		do_action( 'update_site_option_allowedthemes', 'allowedthemes', array(), $themes, 0 );
		$this->sender->do_sync();
		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_network_disabled_themes' );
		$this->perform_network_enable_disable_assertions( $test_themes, $event_data, array() );
		$this->server_event_storage->reset();

		//Prepare for single theme enable and disable tests
		$test_themes = array( $test_themes[0] );
		$themes = array( $test_themes[0][0] => 1 );
		$theme_slugs = array_keys( $themes );

		//Test enable single theme
		/**
		 * This filter is already documented in wp-includes/option.php
		 *
		 * Note that 'allowedthemes' is dynamic, i.e. do_action is called on "update_site_option_{$option}"
		 */
		do_action( 'update_site_option_allowedthemes', 'allowedthemes', $themes, array(), 0 );
		$this->sender->do_sync();
		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_network_enabled_themes' );
		$this->perform_network_enable_disable_assertions( $test_themes, $event_data, $theme_slugs );
		$this->server_event_storage->reset();

		//Test disable single theme
		/**
		 * This filter is already documented in wp-includes/option.php
		 *
		 * Note that 'allowedthemes' is dynamic, i.e. do_action is called on "update_site_option_{$option}"
		 */
		do_action( 'update_site_option_allowedthemes', 'allowedthemes', array(), $themes, 0 );
		$this->sender->do_sync();
		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_network_disabled_themes' );
		$this->perform_network_enable_disable_assertions( $test_themes, $event_data, array() );
	}

	private function perform_network_enable_disable_assertions( $test_themes, $event_data, $enabled_slugs ) {
		foreach ( $test_themes as $theme ) {
			$this->assertEquals( $event_data->args[0][ $theme[0] ]['slug'], $theme[0] );
			$this->assertEquals( $event_data->args[0][ $theme[0] ]['name'], $theme[1] );
			$this->assertTrue( (bool) $event_data->args[0][ $theme[0] ]['version'] );
			$this->assertTrue( (bool) $event_data->args[0][ $theme[0] ]['uri'] );
		}
		$this->assertEquals( $event_data->args[1], $enabled_slugs );
	}

	public function test_install_edit_delete_theme_sync() {
		$theme_slug = 'itek';
		$theme_name = 'iTek';

		delete_theme( $theme_slug ); //Ensure theme is not lingering on file system
		$this->server_event_storage->reset();

		//Test Install Theme

		$this->install_theme( $theme_slug );
		$this->sender->do_sync();

		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_installed_theme' );

		$this->assertEquals( $event_data->args[0], $theme_slug );
		$this->assertEquals( $event_data->args[1]['name'], $theme_name );
		$this->assertTrue( (bool) $event_data->args[1]['version'] );
		$this->assertTrue( (bool) $event_data->args[1]['uri'] );

		//Test Edit Theme

		/**
		 * This filter is already documented in wp-includes/pluggable.php
		 *
		 * @since 1.5.1
		 */
		$_POST['newcontent'] = 'foo';
		apply_filters( 'wp_redirect', 'theme-editor.php?file=style.css&theme=' . $theme_slug . '&scrollto=0&updated=true' );
		$this->sender->do_sync();

		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_edited_theme' );

		$this->assertEquals( $event_data->args[0], $theme_slug );
		$this->assertEquals( $event_data->args[1]['name'], $theme_name );
		$this->assertTrue( (bool) $event_data->args[1]['version'] );
		$this->assertTrue( (bool) $event_data->args[1]['uri'] );

		unset( $_POST['newcontent'] );

		//Test Delete Theme

		delete_theme( $theme_slug );
		$this->sender->do_sync();

		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_deleted_theme' );

		$this->assertEquals( 'itek', $event_data->args[0] );
	}

	public function test_update_themes_sync() {
		$dummy_details = array(
			'type' => 'theme',
			'action' => 'update',
			'themes' => array(
				'twentyseventeen',
				'twentysixteen',
			)
		);

		/** This action is documented in /wp-admin/includes/class-wp-upgrader.php */
		do_action( 'upgrader_process_complete', new Dummy_Sync_Test_WP_Upgrader(), $dummy_details );

		$this->sender->do_sync();

		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_updated_themes' );
		$themes = $event_data->args[0];

		//Not testing versions since they are subject to change
		$this->assertEquals( 'Twenty Seventeen', $themes['twentyseventeen']['name'] );
		$this->assertEquals( 'https://wordpress.org/themes/twentyseventeen/', $themes['twentyseventeen']['uri'] );
		$this->assertEquals( 'twentyseventeen', $themes['twentyseventeen']['stylesheet'] );
		$this->assertEquals( 'Twenty Sixteen', $themes['twentysixteen']['name'] );
		$this->assertEquals( 'https://wordpress.org/themes/twentysixteen/', $themes['twentysixteen']['uri'] );
		$this->assertEquals( 'twentysixteen', $themes['twentysixteen']['stylesheet'] );
	}

	public function test_update_theme_sync() {
		$dummy_details = array(
			'type' => 'theme',
			'action' => 'update',
			'theme' => 'twentyseventeen'
		);

		/** This action is documented in /wp-admin/includes/class-wp-upgrader.php */
		do_action( 'upgrader_process_complete', new Dummy_Sync_Test_WP_Upgrader(), $dummy_details );

		$this->sender->do_sync();

		$event_data = $this->server_event_storage->get_most_recent_event( 'jetpack_updated_themes' );
		$themes = $event_data->args[0];

		//Not testing versions since they are subject to change
		$this->assertEquals( 'Twenty Seventeen', $themes['twentyseventeen']['name'] );
		$this->assertEquals( 'https://wordpress.org/themes/twentyseventeen/', $themes['twentyseventeen']['uri'] );
		$this->assertEquals( 'twentyseventeen', $themes['twentyseventeen']['stylesheet'] );
	}

	public function test_widgets_changes_get_synced() {
		global $wp_registered_sidebars;
		global $wp_version;

		$sidebar_id = 'sidebar-1';
		$sidebar_name = $wp_registered_sidebars[ $sidebar_id ]['name'];

		$sidebar_widgets = array(
			'wp_inactive_widgets' => array( 'author-1' ),
			'sidebar-1' => array( 'nav_menu-1' ),
			'array_version' => 3
		);
		wp_set_sidebars_widgets( $sidebar_widgets );

		$this->sender->do_sync();

		$local_value = get_option( 'sidebars_widgets' );
		$remote_value = $this->server_replica_storage->get_option( 'sidebars_widgets' );
		$this->assertEquals( $local_value, $remote_value, 'We are not syncing sidebar_widgets' );

		// Add widget
		$sidebar_widgets = array(
			'wp_inactive_widgets' => array( 'author-1' ),
			'sidebar-1' => array( 'nav_menu-1', 'calendar-1' ),
			'array_version' => 3
		);
		wp_set_sidebars_widgets( $sidebar_widgets );
		$this->sender->do_sync();


		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_widget_added' );

		$this->assertEquals( $event->args[0], $sidebar_id, 'Added to sidebar not found' );
		$this->assertEquals( $event->args[1], 'calendar-1', 'Added widget not found' );
		$this->assertEquals( $event->args[2], $sidebar_name, 'Added sidebar name not found' );
		$this->assertEquals( $event->args[3], 'Calendar', 'Added widget name not found' );

		// Reorder widget
		$sidebar_widgets  = array(
			'wp_inactive_widgets' => array( 'author-1' ),
			'sidebar-1' => array( 'calendar-1', 'nav_menu-1' ),
			'array_version' => 3
		);
		wp_set_sidebars_widgets( $sidebar_widgets );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_widget_reordered' );

		$this->assertEquals( $event->args[0], $sidebar_id, 'Reordered sidebar not found' );
		$this->assertEquals( $event->args[1], $sidebar_name, 'Reordered sidebar name not found' );

		// Deleted widget
		$sidebar_widgets  = array(
			'wp_inactive_widgets' => array( 'author-1' ),
			'sidebar-1' => array( 'calendar-1' ),
			'array_version' => 3
		);
		wp_set_sidebars_widgets( $sidebar_widgets );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_widget_removed' );

		$this->assertEquals( $event->args[0], $sidebar_id, 'Sidebar not found' );
		$this->assertEquals( $event->args[1], 'nav_menu-1', 'Recent removed widget not found' );

		$this->assertEquals( $event->args[2], $sidebar_name, 'Added sidebar name not found' );

		// WordPress 4.9 changed the label "Custom Menu" for "Navigation menu"
		if ( version_compare( $wp_version, '4.9-alpha', '>=' ) ) {
			$this->assertEquals( $event->args[3], 'Navigation Menu', 'Added widget name not found' );
		} else {
			$this->assertEquals( $event->args[3], 'Custom Menu', 'Added widget name not found' );
		}

		// Moved to inactive
		$sidebar_widgets  = array(
			'wp_inactive_widgets' => array( 'author-1', 'calendar-1' ),
			'sidebar-1' => array(),
			'array_version' => 3
		);
		wp_set_sidebars_widgets( $sidebar_widgets );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_widget_moved_to_inactive' );
		$this->assertEquals( $event->args[0], array( 'calendar-1' ), 'Moved to inactive not present' );
		$this->assertEquals( $event->args[1], array( 'Calendar' ), 'Moved to inactive not present' );

		// Cleared inavite
		$sidebar_widgets  = array(
			'wp_inactive_widgets' => array(),
			'sidebar-1' => array(),
			'array_version' => 3
		);
		wp_set_sidebars_widgets( $sidebar_widgets );
		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_cleared_inactive_widgets' );
		$this->assertTrue( (bool) $event, 'Not fired cleared inacative widgets' );
	}

	public function test_widget_edited() {
		$object = (object) array(
			'name' => 'Search',
			'id' => 'search-1',
		);
		/**
		 * This filter is already documented in wp-includes/class-wp-widget.php
		 */
		do_action( 'widget_update_callback', array(), array( 'title' => 'My Widget' ), array( 'dummy' => 'data' ), $object);

		$this->sender->do_sync();

		$event = $this->server_event_storage->get_most_recent_event( 'jetpack_widget_edited' );
		$this->assertEquals( $event->args[0]['name'], 'Search' );
		$this->assertEquals( $event->args[0]['id'], 'search-1' );
		$this->assertEquals( $event->args[0]['title'], 'My Widget' );
	}

	private function install_theme( $slug ) {
		require_once ABSPATH . 'wp-admin/includes/theme-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		$api = themes_api(
			'theme_information',
			array(
				'slug'   => $slug,
			)
		);

		if ( is_wp_error( $api ) ) {
			wp_die( $api );
		}

		$upgrader = new Theme_Upgrader( new Test_Upgrader_Skin( compact( 'title', 'nonce', 'url', 'theme' ) ) );
		$upgrader->install( $api->download_link );
	}
}
