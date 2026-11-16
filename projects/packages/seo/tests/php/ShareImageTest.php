<?php
/**
 * Default share image validation and fallback tests.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WP_REST_Request;

/** @covers \Automattic\Jetpack\SEO\Share_Image */
#[CoversClass( Share_Image::class )]
class ShareImageTest extends SeoTestCase {
	/** @var int */
	private $user_id;

	/** @var array */
	private $hooks;

	/** @var array */
	private $settings;

	protected function setUp(): void {
		parent::setUp();
		$this->hooks    = array_map(
			static function ( $hook ) {
				return clone $hook;
			},
			$GLOBALS['wp_filter']
		);
		$this->settings = get_registered_settings();
		$this->user_id  = wp_insert_user(
			array(
				'user_login' => 'share_image_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );
		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 );
		$GLOBALS['wp_rest_server'] = null;
	}

	protected function tearDown(): void {
		delete_option( Share_Image::OPTION );
		unregister_setting( Dashboard_Data::SETTINGS_GROUP, Share_Image::OPTION );
		remove_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 );
		remove_filter( 'rest_request_before_callbacks', array( Share_Image::class, 'validate_request' ), 10 );
		wp_set_current_user( 0 );
		wp_delete_user( $this->user_id );
		$GLOBALS['wp_rest_server']         = null;
		$GLOBALS['wp_filter']              = $this->hooks;
		$GLOBALS['wp_registered_settings'] = $this->settings;
		parent::tearDown();
	}

	/**
	 * Create media with the metadata WordPress needs to resolve its full-size URL.
	 *
	 * @param string $mime Image MIME type.
	 * @return int
	 */
	private function attachment( $mime = 'image/jpeg' ) {
		$id = wp_insert_attachment(
			array(
				'post_mime_type' => $mime,
				'post_title'     => 'Share image',
				'post_status'    => 'inherit',
			),
			'share-image.jpg'
		);
		wp_update_attachment_metadata(
			$id,
			array(
				'width'  => 1200,
				'height' => 630,
				'file'   => 'share-image.jpg',
			)
		);
		update_post_meta( $id, '_wp_attachment_image_alt', 'A landscape' );
		return $id;
	}

	/** A saved default must round-trip through the same REST route as the picker. */
	public function test_save_resolve_and_clear_image() {
		$id      = $this->attachment();
		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_param( Share_Image::OPTION, $id );
		$this->assertSame( 200, rest_do_request( $request )->get_status() );
		$image = Dashboard_Data::get_settings_data()['default_share_image'];
		$this->assertSame( $id, $image['id'] );
		$this->assertSame( 'A landscape', $image['alt_text'] );
		$this->assertSame( 1200, $image['width'] );
		$this->assertSame( $image, Share_Image::fallback_image( array() ) );
		$custom = array( 'src' => 'https://example.com/custom.jpg' );
		$this->assertSame( $custom, Share_Image::fallback_image( $custom ) );
		$request->set_param( Share_Image::OPTION, 0 );
		$this->assertSame( 200, rest_do_request( $request )->get_status() );
		$this->assertNull( Dashboard_Data::get_settings_data()['default_share_image'] );
	}

	/**
	 * Invalid writes must leave the saved default intact.
	 *
	 * @param string $kind Invalid choice.
	 * @dataProvider invalid_choices
	 */
	#[DataProvider( 'invalid_choices' )]
	public function test_invalid_choice_preserves_default( $kind ) {
		$id = $this->attachment();
		update_option( Share_Image::OPTION, $id );
		$choices = array(
			'post'     => wp_insert_post(
				array(
					'post_title'  => 'Not media',
					'post_status' => 'publish',
				)
			),
			'svg'      => $this->attachment( 'image/svg+xml' ),
			'missing'  => 999999,
			'negative' => -1,
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_param( Share_Image::OPTION, $choices[ $kind ] );
		$this->assertSame( 400, rest_do_request( $request )->get_status() );
		$this->assertSame( $id, get_option( Share_Image::OPTION ) );
	}

	/** @return array */
	public static function invalid_choices() {
		return array( array( 'post' ), array( 'svg' ), array( 'missing' ), array( 'negative' ) );
	}

	/** Core's manage_options permission must still protect the new setting. */
	public function test_unauthorized_write_is_rejected() {
		$id = $this->attachment();
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_param( Share_Image::OPTION, $id );
		$this->assertSame( 401, rest_do_request( $request )->get_status() );
	}

	/** A deleted image must stop appearing without requiring another settings write. */
	public function test_deleted_image_does_not_resolve() {
		$id = $this->attachment();
		update_option( Share_Image::OPTION, $id );
		wp_delete_attachment( $id, true );
		$this->assertSame( array(), Share_Image::fallback_image( array() ) );
	}
}
