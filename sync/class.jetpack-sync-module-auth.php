<?php
/**
 * Jetpack Auth Sync module.
 *
 * @package wpcomsh
 */

/**
 * The Sync module that implements listeners to authentication events.
 */
class Jetpack_Sync_Module_Auth extends Jetpack_Sync_Module {

	/**
	 * The event handler to be used for events.
	 *
	 * @var Callable
	 */
	private $handler;

	/**
	 * Returns the Sync module name.
	 *
	 * @return String $name
	 */
	public function name() {
		return 'auth';
	}

	/**
	 * Setting up a listener that would report unsafe password usage.
	 *
	 * @param Callable $callable action handler.
	 */
	public function init_listeners( $callable ) {
		$this->handler = $callable;

		// User authentication.
		add_filter( 'authenticate', array( $this, 'check_password' ), 1000, 3 );
	}

	/**
	 * A hook for the authenticate event that checks the password strength.
	 *
	 * @param WP_Error|WP_User $user     the user object, or an error.
	 * @param String           $username the username.
	 * @param Sting            $password the password used to authenticate.
	 * @return WP_Error|WP_User the same object that was passed into the function.
	 */
	public function check_password( $user, $username, $password ) {
		jetpack_require_lib( 'class.jetpack-password-checker' );

		// We are only interested in successful authentication events.
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		$password_checker = new Jetpack_Password_Checker( $user->ID );

		$test_results = $password_checker->test( $password, true );

		// If the password passes tests, we don't do anything.
		if ( empty( $test_results['test_results']['failed'] ) ) {
			return $user;
		}

		call_user_func(
			$this->handler,
			array(
				'warning'          => 'The password failed at least one strength test.',
				'external_user_id' => $user->ID,
				'failures'         => $test_results['test_results']['failed'],
			)
		);
		return $user;
	}
}
