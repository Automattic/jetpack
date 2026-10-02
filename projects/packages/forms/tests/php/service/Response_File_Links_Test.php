<?php
/**
 * Unit Tests for Response_File_Links.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\Service\Response_File_Links
 */
#[CoversClass( Response_File_Links::class )]
class Response_File_Links_Test extends BaseTestCase {

	/**
	 * Set up each test.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'jetpack_unauth_file_download_url', array( $this, 'fake_download_url' ), 10, 2 );
		wp_set_current_user( 0 );
		Feedback::clear_cache();
	}

	/**
	 * Tear down each test.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_unauth_file_download_url', array( $this, 'fake_download_url' ) );
		delete_option( Response_File_Links::SECRET_OPTION );
		parent::tear_down();
	}

	/**
	 * Stand-in for the download handler the Jetpack plugin provides.
	 *
	 * @param string $url     The URL.
	 * @param int    $file_id The file ID.
	 * @return string
	 */
	public function fake_download_url( $url, $file_id ) {
		return 'https://example.org/download/' . $file_id;
	}

	public function test_url_carries_ids_and_a_verifiable_signature() {
		$url = Response_File_Links::get_url( 15, '137061' );
		wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );

		$this->assertStringStartsWith( admin_url( 'admin-post.php' ), $url );
		$this->assertSame( Response_File_Links::ACTION, $query['action'] );
		$this->assertSame( '15', $query['response'] );
		$this->assertSame( '137061', $query['file'] );
		$this->assertTrue( Response_File_Links::verify( 15, 137061, $query['sig'] ) );
	}

	public function test_no_url_without_a_download_handler() {
		remove_filter( 'jetpack_unauth_file_download_url', array( $this, 'fake_download_url' ) );

		$this->assertSame( '', Response_File_Links::get_url( 15, 137061 ) );
	}

	public function test_signature_is_bound_to_the_response_and_the_file() {
		$signature = Response_File_Links::sign( 15, 137061 );

		$this->assertFalse( Response_File_Links::verify( 16, 137061, $signature ) );
		$this->assertFalse( Response_File_Links::verify( 15, 137062, $signature ) );
		$this->assertFalse( Response_File_Links::verify( 15, 137061, '' ) );
		$this->assertFalse( Response_File_Links::verify( 15, 137061, strrev( $signature ) ) );
	}

	public function test_signature_survives_requests_and_dies_with_the_secret() {
		$signature = Response_File_Links::sign( 15, 137061 );

		$this->assertSame( $signature, Response_File_Links::sign( 15, 137061 ) );

		delete_option( Response_File_Links::SECRET_OPTION );

		$this->assertFalse( Response_File_Links::verify( 15, 137061, $signature ) );
	}

	/**
	 * Fetch Metadata combinations, as recorded from Chromium.
	 *
	 * @return array
	 */
	public static function provide_fetch_contexts() {
		return array(
			'no fetch metadata'      => array( array(), true ),
			'typed in address bar'   => array( self::fetch_metadata( 'none', 'navigate', 'document' ), true ),
			'same-origin link'       => array( self::fetch_metadata( 'same-origin', 'navigate', 'document' ), true ),
			'cross-site link click'  => array( self::fetch_metadata( 'cross-site', 'navigate', 'document' ), true ),
			'same-site link click'   => array( self::fetch_metadata( 'same-site', 'navigate', 'document' ), true ),
			'cross-site iframe'      => array( self::fetch_metadata( 'cross-site', 'navigate', 'iframe' ), false ),
			'cross-site image'       => array( self::fetch_metadata( 'cross-site', 'no-cors', 'image' ), false ),
			'cross-site fetch'       => array( self::fetch_metadata( 'cross-site', 'no-cors', 'empty' ), false ),
			'same-site subdomain js' => array( self::fetch_metadata( 'same-site', 'cors', 'empty' ), false ),
		);
	}

	/**
	 * @param array $server   Server variables.
	 * @param bool  $expected Whether the request is allowed.
	 * @dataProvider provide_fetch_contexts
	 */
	#[DataProvider( 'provide_fetch_contexts' )]
	public function test_fetch_context( $server, $expected ) {
		$this->assertSame( $expected, Response_File_Links::is_allowed_fetch_context( $server ) );
	}

	public function test_forged_link_is_refused_before_asking_to_log_in() {
		$response_id = $this->create_response_with_files( array( 137061 ) );

		$result = Response_File_Links::authorize( $response_id, 137061, str_repeat( '0', 64 ) );

		$this->assertSame( 'invalid_link', $result->get_error_code() );
	}

	public function test_logged_out_visitor_is_asked_to_log_in() {
		$response_id = $this->create_response_with_files( array( 137061 ) );

		$result = Response_File_Links::authorize( $response_id, 137061, Response_File_Links::sign( $response_id, 137061 ) );

		$this->assertSame( 'not_logged_in', $result->get_error_code() );
	}

	public function test_user_who_cannot_view_responses_is_refused() {
		$response_id = $this->create_response_with_files( array( 137061 ) );
		wp_set_current_user( $this->create_user( 'author' ) );

		$result = Response_File_Links::authorize( $response_id, 137061, Response_File_Links::sign( $response_id, 137061 ) );

		$this->assertSame( 'forbidden', $result->get_error_code() );
	}

	public function test_file_from_another_response_is_refused() {
		$response_id = $this->create_response_with_files( array( 137061 ) );
		wp_set_current_user( $this->create_user( 'editor' ) );

		$result = Response_File_Links::authorize( $response_id, 137099, Response_File_Links::sign( $response_id, 137099 ) );

		$this->assertSame( 'not_found', $result->get_error_code() );
	}

	public function test_editor_may_download_each_file_of_the_response() {
		$response_id = $this->create_response_with_files( array( 137061, 137062 ) );
		wp_set_current_user( $this->create_user( 'editor' ) );

		$this->assertTrue( Response_File_Links::authorize( $response_id, 137061, Response_File_Links::sign( $response_id, 137061 ) ) );
		$this->assertTrue( Response_File_Links::authorize( $response_id, 137062, Response_File_Links::sign( $response_id, 137062 ) ) );
	}

	public function test_files_by_field_lists_every_file_with_its_link() {
		$response_id = $this->create_response_with_files( array( 137061, 137062 ) );

		$files_by_field = Response_File_Links::get_files_by_field( $response_id, Feedback::get( $response_id ) );

		$this->assertSame( array( 'upload' ), array_keys( $files_by_field ) );
		$this->assertSame(
			array(
				array(
					'name' => 'file-137061.pdf',
					'size' => 2048,
					'type' => 'application/pdf',
					'url'  => Response_File_Links::get_url( $response_id, 137061 ),
				),
				array(
					'name' => 'file-137062.pdf',
					'size' => 2048,
					'type' => 'application/pdf',
					'url'  => Response_File_Links::get_url( $response_id, 137062 ),
				),
			),
			$files_by_field['upload']
		);
	}

	/**
	 * Build Fetch Metadata server variables.
	 *
	 * @param string $site Sec-Fetch-Site.
	 * @param string $mode Sec-Fetch-Mode.
	 * @param string $dest Sec-Fetch-Dest.
	 * @return array
	 */
	private static function fetch_metadata( $site, $mode, $dest ) {
		return array(
			'HTTP_SEC_FETCH_SITE' => $site,
			'HTTP_SEC_FETCH_MODE' => $mode,
			'HTTP_SEC_FETCH_DEST' => $dest,
		);
	}

	/**
	 * Create a user with a role.
	 *
	 * @param string $role The role.
	 * @return int The user ID.
	 */
	private function create_user( $role ) {
		return wp_insert_user(
			array(
				'user_login' => 'test_' . $role . '_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
	}

	/**
	 * Save a response whose file field holds the given files.
	 *
	 * @param int[] $file_ids The uploaded file IDs.
	 * @return int The feedback post ID.
	 */
	private function create_response_with_files( $file_ids ) {
		$form = new Contact_Form( array(), "[contact-field label='Upload' type='file' id='upload' maxfiles='5'/]" );

		$files = array();
		foreach ( $file_ids as $file_id ) {
			$files[] = wp_json_encode(
				array(
					'file_id' => $file_id,
					'name'    => 'file-' . $file_id . '.pdf',
					'size'    => 2048,
					'type'    => 'application/pdf',
				),
				JSON_UNESCAPED_SLASHES
			);
		}

		$post_id = Feedback::from_submission( array( 'upload' => $files ), $form )->save();

		return is_int( $post_id ) ? $post_id : $post_id->ID;
	}
}
