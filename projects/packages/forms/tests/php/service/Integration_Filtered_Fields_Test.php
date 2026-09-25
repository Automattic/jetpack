<?php
/**
 * Tests that email integrations respect the visible fields supplied by the submission hook.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field;
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers Automattic\Jetpack\Forms\Service\MailPoet_Integration
 * @covers Automattic\Jetpack\Forms\Service\Hostinger_Reach_Integration
 */
#[CoversClass( MailPoet_Integration::class )]
#[CoversClass( Hostinger_Reach_Integration::class )]
class Integration_Filtered_Fields_Test extends BaseTestCase {

	/**
	 * Both legacy extractors must use their argument rather than re-reading the form.
	 *
	 * @dataProvider integration_provider
	 *
	 * @param string $integration Integration class.
	 */
	#[DataProvider( 'integration_provider' )]
	public function test_legacy_subscriber_data_uses_filtered_fields( $integration ) {
		$form = new Contact_Form( array( 'id' => 'integration-form' ) );

		$email        = new Contact_Form_Field(
			array(
				'id'    => 'email',
				'type'  => 'email',
				'label' => 'Email',
			),
			'',
			$form
		);
		$email->value = 'hidden@example.com';
		$name         = new Contact_Form_Field(
			array(
				'id'    => 'firstname',
				'type'  => 'text',
				'label' => 'First Name',
			),
			'',
			$form
		);
		$name->value  = 'Visible';
		$form->fields = array( $email, $name );

		$method = new \ReflectionMethod( $integration, 'get_subscriber_data_from_fields' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( array(), $method->invoke( null, array( $name ) ) );
	}

	/**
	 * Integrations with legacy field extractors.
	 *
	 * @return array
	 */
	public static function integration_provider() {
		return array(
			'MailPoet'        => array( MailPoet_Integration::class ),
			'Hostinger Reach' => array( Hostinger_Reach_Integration::class ),
		);
	}

	/**
	 * Unversioned JSON feedback uses the same structured field API as v2 and v3 entries.
	 */
	public function test_unversioned_json_feedback_is_structured() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Feedback::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => wp_json_encode(
					array(
						'fields' => array(
							array(
								'id'    => 'email',
								'label' => 'Email',
								'type'  => 'email',
								'value' => 'reader@example.com',
							),
						),
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);

		Feedback::clear_cache();
		$feedback = Feedback::get( $post_id );

		$this->assertInstanceOf( Feedback::class, $feedback );
		$this->assertTrue( $feedback->uses_structured_fields() );

		wp_delete_post( $post_id, true );
		Feedback::clear_cache();
	}
}
