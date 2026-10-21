<?php
/**
 * Unit tests for Integration_Dispatcher.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Integration_Dispatcher.
 *
 * @covers Automattic\Jetpack\Forms\Integrations\Integration_Dispatcher
 */
#[CoversClass( Integration_Dispatcher::class )]
class Integration_Dispatcher_Test extends BaseTestCase {

	/**
	 * Contexts passed to the test integration's on_submission callback.
	 *
	 * @var array[]
	 */
	private $calls = array();

	/**
	 * Register a test integration and prepare a submittable form.
	 */
	protected function set_up() {
		add_filter( 'pre_wp_mail', '__return_true', PHP_INT_MAX );
		$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
		$_SERVER['HTTP_REFERER']    = 'test';

		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Contact',
				'post_content' => 'Form',
				'post_status'  => 'publish',
			)
		);

		$GLOBALS['post']                   = get_post( $post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$_POST                             = array();
		$_POST['contact-form-id']          = $post_id;
		$_POST[ 'g' . $post_id . '-name' ] = 'Jane Doe';

		Contact_Form_Plugin::init()->process_form_submission();

		Integration_Registry::reset();
		Built_In_Integrations::reset();
		Built_In_Integrations::register();

		$this->calls = array();
		jetpack_forms_register_integration(
			'acme/recorder',
			array(
				'title'         => 'Recorder',
				'on_submission' => function ( $context ) {
					$this->calls[] = $context;
				},
			)
		);

		Integration_Dispatcher::init();
	}

	/**
	 * Undo the global state set up for the submission.
	 */
	protected function tear_down() {
		remove_action( 'grunion_after_feedback_post_inserted', array( Integration_Dispatcher::class, 'dispatch' ), 10 );
		remove_all_filters( 'pre_wp_mail' );
		remove_all_filters( 'jetpack_contact_form_is_spam' );
		Integration_Registry::reset();
		Built_In_Integrations::reset();
		Contact_Form::$forms        = array();
		Contact_Form::$last         = null;
		Contact_Form::$current_form = null;
		$_POST                      = array();
	}

	/**
	 * Submit a one-field form carrying the given integration settings.
	 *
	 * @param array $integrations The form's `integrations` attribute.
	 * @return void
	 */
	private function submit( array $integrations ) {
		$form = new Contact_Form( array( 'integrations' => $integrations ), "[contact-field label='Name' type='name'/]" );
		$form->process_submission();
	}

	public function test_an_enabled_integration_receives_the_submission() {
		$this->submit( array( 'acme/recorder' => array( 'enabled' => true ) ) );

		$this->assertCount( 1, $this->calls );

		$context = $this->calls[0];
		// Contact_Form stringifies attribute values, so `enabled` arrives as '1'.
		$this->assertNotEmpty( $context['settings']['enabled'] );
		$this->assertInstanceOf( Contact_Form::class, $context['form'] );
		$this->assertInstanceOf( Feedback::class, $context['feedback'] );
		$this->assertSame( 'feedback', get_post_type( $context['post_id'] ) );
	}

	/**
	 * Cases in which the integration must not be called.
	 *
	 * @return array
	 */
	public static function skipped_submission_provider() {
		return array(
			'disabled on the form'       => array( array( 'acme/recorder' => array( 'enabled' => false ) ), 'none' ),
			'not configured on the form' => array( array(), 'none' ),
			'integration unavailable'    => array( array( 'acme/recorder' => array( 'enabled' => true ) ), 'unavailable' ),
			'submission is spam'         => array( array( 'acme/recorder' => array( 'enabled' => true ) ), 'spam' ),
		);
	}

	/**
	 * @dataProvider skipped_submission_provider
	 *
	 * @param array  $integrations The form's `integrations` attribute.
	 * @param string $condition    Extra state to set up before submitting.
	 */
	#[DataProvider( 'skipped_submission_provider' )]
	public function test_the_integration_is_not_called( array $integrations, $condition ) {
		if ( 'unavailable' === $condition ) {
			jetpack_forms_register_integration(
				'acme/recorder',
				array(
					'is_available'  => '__return_false',
					'on_submission' => function ( $context ) {
						$this->calls[] = $context;
					},
				)
			);
		} elseif ( 'spam' === $condition ) {
			add_filter( 'jetpack_contact_form_is_spam', '__return_true' );
		}

		$this->submit( $integrations );

		$this->assertSame( array(), $this->calls );
	}
}
