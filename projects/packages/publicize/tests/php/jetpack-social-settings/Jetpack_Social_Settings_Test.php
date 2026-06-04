<?php
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as SocialSettings;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Templates;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Testing the Settings class.
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */ ]
class Jetpack_Social_Settings_Test extends BaseTestCase {
	/**
	 * Instance of the Settings class.
	 *
	 * @var SocialSettings $settings
	 */
	protected $settings;

	/**
	 * Initialize tests
	 */
	public function set_up() {
		add_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		global $publicize;
		$publicize = $this->getMockBuilder( Publicize::class )->onlyMethods( array( 'has_social_image_generator_feature' ) )->getMock();
		$publicize->method( 'has_social_image_generator_feature' )
			->withAnyParameters()
			->willReturn( true );
		$this->settings = new SocialSettings();
		$this->settings->register_settings();
	}

	/**
	 * Tear down
	 */
	public function tear_down() {
		wp_set_current_user( 0 );

		global $publicize;
		$publicize = new Publicize();

		remove_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Reset Open Graph filter registration state.
	 *
	 * @return void
	 */
	private function reset_open_graph_filters() {
		remove_filter( 'jetpack_og_default_site_image', array( SocialSettings::class, 'filter_default_site_image' ), 10 );
		remove_filter( 'jetpack_open_graph_image_default', array( SocialSettings::class, 'filter_default_image_url' ) );
		remove_filter( 'jetpack_open_graph_tags', array( SocialSettings::class, 'add_default_image_to_open_graph_tags' ), 13 );

		$reflection = new \ReflectionClass( SocialSettings::class );
		$property   = $reflection->getProperty( 'open_graph_filters_hooked_in' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );
	}

	/**
	 * Create an upload object.
	 *
	 * @param string $file File path.
	 * @return int
	 */
	private function create_upload_object( $file ) {
		$contents = file_get_contents( $file );
		$upload   = wp_upload_bits( basename( $file ), null, $contents );
		$mime     = wp_check_filetype( $upload['file'] );

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_mime_type' => $mime['type'],
			'guid'           => $upload['url'],
		);

		$id = wp_insert_attachment( $attachment, $upload['file'] );

		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		return $id;
	}

	/**
	 * Mock Publicize being active.
	 *
	 * @return array
	 */
	public function mock_publicize_being_active() {
		return array( 'publicize' );
	}

	/**
	 * Tests that the settings are returned correctly with the availability parameter.
	 */
	public function test_get_settings_with_availability() {
		$settings = $this->settings->get_settings( true );

		$this->assertArrayHasKey( 'socialImageGeneratorSettings', $settings );
		$this->assertArrayHasKey( 'available', $settings['socialImageGeneratorSettings'] );

		$this->assertTrue( $settings['socialImageGeneratorSettings']['available'] );
	}

	/**
	 * Tests that the settings are returned correctly on new sites without the option.
	 */
	public function test_settings_on_new_site() {
		$settings = $this->settings->get_settings();

		$this->assertArrayHasKey( 'socialImageGeneratorSettings', $settings );
		$this->assertArrayHasKey( 'openGraphSettings', $settings );
		$this->assertArrayHasKey( 'enabled', $settings['socialImageGeneratorSettings'] );
		$this->assertArrayHasKey( 'template', $settings['socialImageGeneratorSettings'] );
		$this->assertArrayHasKey( 'default_image_id', $settings['openGraphSettings'] );

		$this->assertFalse( $settings['socialImageGeneratorSettings']['enabled'] );
		$this->assertEquals( Templates::DEFAULT_TEMPLATE, $settings['socialImageGeneratorSettings']['template'] );
		$this->assertSame( 0, $settings['openGraphSettings']['default_image_id'] );
	}

	/**
	 * Tests that Open Graph filters are registered for the default image setting.
	 */
	public function test_register_open_graph_filters_hooks_callbacks() {
		$this->reset_open_graph_filters();

		SocialSettings::register_open_graph_filters();

		$this->assertSame(
			10,
			has_filter( 'jetpack_og_default_site_image', array( SocialSettings::class, 'filter_default_site_image' ) )
		);
		$this->assertSame(
			10,
			has_filter( 'jetpack_open_graph_image_default', array( SocialSettings::class, 'filter_default_image_url' ) )
		);
		$this->assertSame(
			13,
			has_filter( 'jetpack_open_graph_tags', array( SocialSettings::class, 'add_default_image_to_open_graph_tags' ) )
		);
	}

	/**
	 * Tests that invalid stored Open Graph settings fall back to defaults.
	 */
	public function test_open_graph_settings_default_when_stored_value_is_invalid() {
		update_option( 'jetpack_social_open_graph_settings', 'invalid-settings' );

		$this->assertSame(
			array( 'default_image_id' => 0 ),
			$this->settings->get_open_graph_settings()
		);
	}

	/**
	 * Tests that non-array Open Graph setting updates are ignored.
	 */
	public function test_open_graph_settings_ignore_non_array_updates() {
		$this->settings->update_open_graph_settings( 'invalid-settings' );

		$this->assertSame( 0, $this->settings->og_get_default_image_id() );
	}

	/**
	 * Tests that update_settings routes Open Graph settings to their updater.
	 */
	public function test_update_settings_routes_open_graph_settings() {
		$updated = $this->settings->update_settings(
			false,
			'jetpack_social_open_graph_settings',
			array( 'default_image_id' => '123' )
		);

		$this->assertTrue( $updated );
		$this->assertSame( 123, $this->settings->og_get_default_image_id() );
	}

	/**
	 * Tests that the default Open Graph image ID can be updated and cleared.
	 */
	public function test_open_graph_default_image_id_can_be_set_and_cleared() {
		$this->settings->update_open_graph_settings( array( 'default_image_id' => '123' ) );
		$this->assertSame( 123, $this->settings->og_get_default_image_id() );

		$this->settings->update_open_graph_settings( array( 'default_image_id' => 0 ) );
		$this->assertSame( 0, $this->settings->og_get_default_image_id() );
	}

	/**
	 * Tests that the configured Open Graph image is returned with dimensions.
	 */
	public function test_get_open_graph_default_image_returns_attachment_details() {
		$attachment_id = $this->create_upload_object( __DIR__ . '/../images/jetpack-logo.png' );
		$this->settings->update_open_graph_settings( array( 'default_image_id' => $attachment_id ) );

		$image = $this->settings->og_get_default_image();

		$this->assertSame( wp_get_attachment_url( $attachment_id ), $image['src'] );
		$this->assertSame( 100, $image['width'] );
		$this->assertSame( 38, $image['height'] );
		$this->assertSame( 'jetpack_social_default_og_image', $image['type'] );
	}

	/**
	 * Tests that no Open Graph image is returned without a configured image.
	 */
	public function test_get_open_graph_default_image_returns_empty_without_attachment() {
		$this->assertSame( array(), $this->settings->og_get_default_image() );
	}

	/**
	 * Tests that the configured Open Graph image includes alt text.
	 */
	public function test_get_open_graph_default_image_returns_alt_text() {
		$attachment_id = $this->create_upload_object( __DIR__ . '/../images/jetpack-logo.png' );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', 'Jetpack logo' );
		$this->settings->update_open_graph_settings( array( 'default_image_id' => $attachment_id ) );

		$image = $this->settings->og_get_default_image();

		$this->assertSame( 'Jetpack logo', $image['alt_text'] );
	}

	/**
	 * Tests that the default Open Graph filters use the configured image.
	 */
	public function test_open_graph_filters_use_configured_default_image() {
		$attachment_id = $this->create_upload_object( __DIR__ . '/../images/jetpack-logo.png' );
		$this->settings->update_open_graph_settings( array( 'default_image_id' => $attachment_id ) );

		$image_url = wp_get_attachment_url( $attachment_id );

		$this->assertSame(
			$image_url,
			apply_filters( 'jetpack_open_graph_image_default', 'https://s0.wp.com/i/blank.jpg' )
		);

		$site_image = apply_filters( 'jetpack_og_default_site_image', array(), array() );

		$this->assertSame( $image_url, $site_image['src'] );
		$this->assertSame( 100, $site_image['width'] );
		$this->assertSame( 38, $site_image['height'] );
	}

	/**
	 * Tests that Open Graph filters keep existing fallbacks without a configured image.
	 */
	public function test_open_graph_filters_keep_existing_values_without_configured_image() {
		$custom_site_image = array( 'src' => 'https://example.com/custom.jpg' );
		$tags              = array( 'og:title' => 'Test post' );

		$this->assertSame(
			$custom_site_image,
			$this->settings->filter_default_site_image( $custom_site_image, array() )
		);
		$this->assertSame(
			'https://example.com/default.jpg',
			$this->settings->filter_default_image_url( 'https://example.com/default.jpg' )
		);
		$this->assertSame(
			$tags,
			$this->settings->add_default_image_to_open_graph_tags( $tags )
		);
	}

	/**
	 * Tests that the default Open Graph tag filter only adds an image when one is missing.
	 */
	public function test_open_graph_tags_filter_only_adds_missing_image() {
		$attachment_id = $this->create_upload_object( __DIR__ . '/../images/jetpack-logo.png' );
		$this->settings->update_open_graph_settings( array( 'default_image_id' => $attachment_id ) );

		$tags = apply_filters(
			'jetpack_open_graph_tags',
			array(
				'og:title' => 'Test post',
			)
		);

		$this->assertSame( wp_get_attachment_url( $attachment_id ), $tags['og:image'] );
		$this->assertSame( 100, $tags['og:image:width'] );
		$this->assertSame( 38, $tags['og:image:height'] );

		$tags_with_image = apply_filters(
			'jetpack_open_graph_tags',
			array(
				'og:title' => 'Test post',
				'og:image' => 'https://example.com/post-image.jpg',
			)
		);

		$this->assertSame( 'https://example.com/post-image.jpg', $tags_with_image['og:image'] );
	}

	/**
	 * Tests that the default Open Graph tag filter includes alt text.
	 */
	public function test_open_graph_tags_filter_adds_alt_text() {
		$attachment_id = $this->create_upload_object( __DIR__ . '/../images/jetpack-logo.png' );
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', 'Jetpack logo' );
		$this->settings->update_open_graph_settings( array( 'default_image_id' => $attachment_id ) );

		$tags = apply_filters(
			'jetpack_open_graph_tags',
			array(
				'og:title' => 'Test post',
			)
		);

		$this->assertSame( 'Jetpack logo', $tags['og:image:alt'] );
	}

	/**
	 * Tests that the sites can be migrated from the old set of options
	 */
	public function test_migrate_old_options() {
		update_option( 'jetpack_social_settings', array( 'image' => true ) );
		update_option(
			'jetpack_social_image_generator_settings',
			array(
				'enabled'  => true,
				'defaults' => array( 'template' => 'example_template' ),
			)
		);

		$expected_options = array(
			'socialImageGeneratorSettings' => array(
				'enabled'  => true,
				'template' => 'example_template',
			),
			'openGraphSettings'            => array(
				'default_image_id' => 0,
			),
		);

		$this->settings = new SocialSettings();

		$this->assertEquals( $expected_options, $this->settings->get_settings() );
	}

	/**
	 * Tests that the sites can be migrated from the old set of options with missing template option
	 */
	public function test_migrate_old_options_with_missing() {
		update_option( 'jetpack_social_settings', array( 'image' => true ) );

		$expected_options = array(
			'socialImageGeneratorSettings' => array(
				'enabled'  => false,
				'template' => Templates::DEFAULT_TEMPLATE,
			),
			'openGraphSettings'            => array(
				'default_image_id' => 0,
			),
		);

		$this->settings = new SocialSettings();
		$this->assertEquals( $expected_options, $this->settings->get_settings() );
	}
}
