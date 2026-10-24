<?php
/**
 * Tests for Message_Builder.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Send\Message_Builder
 */
#[CoversClass( Message_Builder::class )]
class Message_Builder_Test extends BaseTestCase {

	const SETTINGS = array(
		'enabled'         => true,
		'from_name'       => 'Example Shop',
		'from_local_part' => 'hello',
		'fallback'        => true,
	);

	const ACCOUNT = array( 'domain' => 'example.com' );

	/**
	 * Temp files to delete after each test.
	 *
	 * @var string[]
	 */
	private $temp_files = array();

	/**
	 * Remove temp files and test filters.
	 */
	public function tear_down() {
		foreach ( $this->temp_files as $file ) {
			if ( file_exists( $file ) ) {
				unlink( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			}
		}
		$this->temp_files = array();
		remove_all_filters( 'wp_mail_from' );
		remove_all_filters( 'wp_mail_from_name' );
		remove_all_filters( 'wp_mail_content_type' );
		parent::tear_down();
	}

	/**
	 * Build a payload from default wp_mail() arguments plus overrides.
	 *
	 * @param array $overrides wp_mail() attributes to replace.
	 * @return array|WP_Error
	 */
	private function build( array $overrides = array() ) {
		$atts = array_merge(
			array(
				'to'          => 'customer@example.org',
				'subject'     => 'Order received',
				'message'     => 'Thanks!',
				'headers'     => '',
				'attachments' => array(),
			),
			$overrides
		);
		return Message_Builder::build( $atts, self::SETTINGS, self::ACCOUNT );
	}

	/**
	 * Create a temp file with the given contents.
	 *
	 * @param string $contents File contents.
	 * @return string Path.
	 */
	private function temp_file( $contents ) {
		$path = tempnam( sys_get_temp_dir(), 'jps' );
		file_put_contents( $path, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$this->temp_files[] = $path;
		return $path;
	}

	/**
	 * Cases pairing wp_mail() arguments with the payload keys they should produce.
	 *
	 * @return array[]
	 */
	public static function provide_messages() {
		return array(
			'plain defaults'                             => array(
				array(),
				array(
					'personalizations' => array( array( 'to' => array( array( 'email' => 'customer@example.org' ) ) ) ),
					'from'             => array(
						'email' => 'hello@example.com',
						'name'  => 'Example Shop',
					),
					'subject'          => 'Order received',
					'content'          => array(
						array(
							'type'  => 'text/plain',
							'value' => 'Thanks!',
						),
					),
				),
			),
			'string headers with Cc, Bcc, Reply-To and names' => array(
				array(
					'to'      => 'Jane Doe <jane@example.org>, bob@example.org',
					'headers' => "Cc: cc@example.org\r\nBcc: Hidden <bcc@example.org>\r\nReply-To: support@example.com",
				),
				array(
					'personalizations' => array(
						array(
							'to'  => array(
								array(
									'email' => 'jane@example.org',
									'name'  => 'Jane Doe',
								),
								array( 'email' => 'bob@example.org' ),
							),
							'cc'  => array( array( 'email' => 'cc@example.org' ) ),
							'bcc' => array(
								array(
									'email' => 'bcc@example.org',
									'name'  => 'Hidden',
								),
							),
						),
					),
					'reply_to'         => array( 'email' => 'support@example.com' ),
				),
			),
			'on-domain From header is kept'              => array(
				array( 'headers' => array( 'From: Orders <orders@example.com>' ) ),
				array(
					'from' => array(
						'email' => 'orders@example.com',
						'name'  => 'Orders',
					),
				),
			),
			'off-domain From is replaced and kept as Reply-To' => array(
				array( 'headers' => array( 'From: Store <store@gmail.com>' ) ),
				array(
					'from'     => array(
						'email' => 'hello@example.com',
						'name'  => 'Store',
					),
					'reply_to' => array(
						'email' => 'store@gmail.com',
						'name'  => 'Store',
					),
				),
			),
			'off-domain From keeps an explicit Reply-To' => array(
				array( 'headers' => array( 'From: store@gmail.com', 'Reply-To: help@example.com' ) ),
				array(
					'from'     => array(
						'email' => 'hello@example.com',
						'name'  => 'Example Shop',
					),
					'reply_to' => array( 'email' => 'help@example.com' ),
				),
			),
			'html gets a plain-text part first'          => array(
				array(
					'message' => '<p>Hello <strong>there</strong></p><p>Line two</p>',
					'headers' => 'Content-Type: text/html; charset=UTF-8',
				),
				array(
					'content' => array(
						array(
							'type'  => 'text/plain',
							'value' => "Hello there\n\nLine two",
						),
						array(
							'type'  => 'text/html',
							'value' => '<p>Hello <strong>there</strong></p><p>Line two</p>',
						),
					),
				),
			),
			'custom headers pass, forbidden ones are dropped' => array(
				array( 'headers' => array( 'X-Order-Id: 42', 'Message-ID: <abc@example.com>', 'To: someone@example.net' ) ),
				array( 'headers' => array( 'X-Order-Id' => '42' ) ),
			),
		);
	}

	/**
	 * @dataProvider provide_messages
	 *
	 * @param array $overrides wp_mail() attributes.
	 * @param array $expected  Payload keys and their expected values.
	 */
	#[DataProvider( 'provide_messages' )]
	public function test_build_maps_wp_mail_arguments( array $overrides, array $expected ) {
		$payload = $this->build( $overrides );

		$this->assertIsArray( $payload );
		foreach ( $expected as $key => $value ) {
			$this->assertSame( $value, $payload[ $key ], "Payload key: $key" );
		}
	}

	public function test_build_applies_wp_mail_filters_before_enforcing_the_domain() {
		add_filter( 'wp_mail_content_type', fn() => 'text/html' );
		add_filter( 'wp_mail_from', fn() => 'woo@gmail.com' );
		add_filter( 'wp_mail_from_name', fn() => 'Woo' );

		$payload = $this->build( array( 'message' => 'Hi<br>there' ) );

		$this->assertSame(
			array(
				'email' => 'hello@example.com',
				'name'  => 'Woo',
			),
			$payload['from']
		);
		$this->assertSame(
			array(
				'email' => 'woo@gmail.com',
				'name'  => 'Woo',
			),
			$payload['reply_to']
		);
		$this->assertSame(
			array(
				array(
					'type'  => 'text/plain',
					'value' => "Hi\nthere",
				),
				array(
					'type'  => 'text/html',
					'value' => 'Hi<br>there',
				),
			),
			$payload['content']
		);
	}

	public function test_build_encodes_attachments_from_lists_and_named_arrays() {
		$path = $this->temp_file( 'invoice body' );

		$payload = $this->build(
			array(
				'attachments' => array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- Mixing list and named entries is the case under test.
					$path,
					'receipt.pdf' => $path,
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'content'  => base64_encode( 'invoice body' ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
					'filename' => wp_basename( $path ),
					'type'     => 'application/octet-stream',
				),
				array(
					'content'  => base64_encode( 'invoice body' ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
					'filename' => 'receipt.pdf',
					'type'     => 'application/pdf',
				),
			),
			$payload['attachments']
		);
	}

	/**
	 * Messages MailChannels can't take, and the error each returns.
	 *
	 * @return array[]
	 */
	public static function provide_unbuildable_messages() {
		return array(
			'no valid recipient'        => array( array( 'to' => 'not-an-email' ), 'jetpack_send_no_recipients' ),
			'custom multipart boundary' => array( array( 'headers' => 'Content-Type: multipart/alternative; boundary="abc"' ), 'jetpack_send_unsupported' ),
			'unreadable attachment'     => array( array( 'attachments' => array( '/nonexistent/file.pdf' ) ), 'jetpack_send_attachment_unreadable' ),
			'stream wrapper path'       => array( array( 'attachments' => array( 'phar:///tmp/x.phar/file.txt' ) ), 'jetpack_send_attachment_unreadable' ),
			'inline embeds'             => array( array( 'embeds' => array( '/tmp/logo.png' ) ), 'jetpack_send_unsupported' ),
			'non-UTF-8 charset'         => array( array( 'headers' => 'Content-Type: text/plain; charset=ISO-8859-1' ), 'jetpack_send_unsupported' ),
			'only a Bcc recipient'      => array(
				array(
					'to'      => '',
					'headers' => 'Bcc: hidden@example.org',
				),
				'jetpack_send_unsupported',
			),
		);
	}

	/**
	 * @dataProvider provide_unbuildable_messages
	 *
	 * @param array  $overrides wp_mail() attributes.
	 * @param string $code      Expected error code.
	 */
	#[DataProvider( 'provide_unbuildable_messages' )]
	public function test_build_returns_an_error_for_unbuildable_messages( array $overrides, $code ) {
		$result = $this->build( $overrides );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( $code, $result->get_error_code() );
	}

	public function test_build_rejects_attachments_over_the_size_limit() {
		$path   = $this->temp_file( '' );
		$handle = fopen( $path, 'r+' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
		ftruncate( $handle, Message_Builder::MAX_ATTACHMENT_BYTES + 1 );
		fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

		$result = $this->build( array( 'attachments' => array( $path ) ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_send_attachment_too_large', $result->get_error_code() );
	}
}
