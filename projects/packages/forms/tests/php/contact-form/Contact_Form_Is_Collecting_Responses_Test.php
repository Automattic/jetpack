<?php
/**
 * Unit tests for Contact_Form::is_collecting_responses().
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form::is_collecting_responses().
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
#[CoversClass( Contact_Form::class )]
class Contact_Form_Is_Collecting_Responses_Test extends BaseTestCase {

	/**
	 * Data provider for is_collecting_responses().
	 *
	 * @return array<string,array{0:array<string,mixed>,1:bool}>
	 */
	public static function provide_attributes() {
		return array(
			'empty attributes default to collecting'   => array( array(), true ),
			'email and saving both on'                 => array(
				array(
					'emailNotifications' => true,
					'saveResponses'      => true,
				),
				true,
			),
			'email off and saving off, no integration' => array(
				array(
					'emailNotifications' => false,
					'saveResponses'      => false,
				),
				false,
			),
			'yes/no strings, both off'                 => array(
				array(
					'emailNotifications' => 'no',
					'saveResponses'      => 'no',
				),
				false,
			),
			'only saving on (string yes)'              => array(
				array(
					'emailNotifications' => 'no',
					'saveResponses'      => 'yes',
				),
				true,
			),
			'email on with empty recipient still collects (admin email fallback)' => array(
				array(
					'emailNotifications' => true,
					'to'                 => '  ',
					'saveResponses'      => false,
				),
				true,
			),
			'email on with recipient'                  => array(
				array(
					'emailNotifications' => true,
					'to'                 => 'admin@example.com',
					'saveResponses'      => false,
				),
				true,
			),
			'jetpackCRM explicitly enabled'            => array(
				array(
					'emailNotifications' => false,
					'saveResponses'      => false,
					'jetpackCRM'         => true,
				),
				true,
			),
			'mailpoet enabled for form'                => array(
				array(
					'emailNotifications' => false,
					'saveResponses'      => false,
					'mailpoet'           => array( 'enabledForForm' => true ),
				),
				true,
			),
			'hostinger reach enabled for form'         => array(
				array(
					'emailNotifications' => false,
					'saveResponses'      => false,
					'hostingerReach'     => array( 'enabledForForm' => true ),
				),
				true,
			),
			'salesforce with org id'                   => array(
				array(
					'emailNotifications' => false,
					'saveResponses'      => false,
					'salesforceData'     => array(
						'sendToSalesforce' => true,
						'organizationId'   => '00D5g000000abcd',
					),
				),
				true,
			),
			'salesforce without org id is not a sink'  => array(
				array(
					'emailNotifications' => false,
					'saveResponses'      => false,
					'salesforceData'     => array(
						'sendToSalesforce' => true,
						'organizationId'   => '',
					),
				),
				false,
			),
		);
	}

	/**
	 * @dataProvider provide_attributes
	 *
	 * @param array<string,mixed> $attributes Raw block attributes.
	 * @param bool                $expected   Expected collecting state.
	 */
	#[DataProvider( 'provide_attributes' )]
	public function test_is_collecting_responses( array $attributes, bool $expected ) {
		$this->assertSame( $expected, Contact_Form::is_collecting_responses( $attributes ) );
	}

	/**
	 * Non-array input should never be treated as a broken form.
	 */
	public function test_non_array_attributes_are_collecting() {
		$this->assertTrue( Contact_Form::is_collecting_responses( null ) );
	}

	/**
	 * The rendered form shows the admin-only notice to users who can manage forms.
	 */
	public function test_front_end_notice_visible_to_editors() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'cf_notice_admin',
				'user_pass'  => 'password',
				'user_email' => 'cf_notice_admin@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$content = '[contact-field type="name" label="Name" required="1" /]';

		$broken = Contact_Form::parse(
			array(
				'emailNotifications' => false,
				'saveResponses'      => false,
			),
			$content
		);
		$this->assertStringContainsString( 'jetpack-form-not-collecting-notice', $broken, 'Editors should see the not-collecting notice.' );

		$healthy = Contact_Form::parse(
			array(
				'emailNotifications' => true,
				'saveResponses'      => true,
			),
			$content
		);
		$this->assertStringNotContainsString( 'jetpack-form-not-collecting-notice', $healthy, 'A collecting form should not show the notice.' );
	}

	/**
	 * The rendered form never shows the notice to logged-out visitors.
	 */
	public function test_front_end_notice_hidden_from_visitors() {
		wp_set_current_user( 0 );

		$content = '[contact-field type="name" label="Name" required="1" /]';
		$broken  = Contact_Form::parse(
			array(
				'emailNotifications' => false,
				'saveResponses'      => false,
			),
			$content
		);

		$this->assertStringNotContainsString( 'jetpack-form-not-collecting-notice', $broken, 'Visitors should never see the notice.' );
	}
}
