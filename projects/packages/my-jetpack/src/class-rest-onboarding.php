<?php
/**
 * Records how someone left My Jetpack's setup flow.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Registers the REST route that settles the setup flow.
 *
 * @phan-constructor-used-for-side-effects
 */
class REST_Onboarding {
	/**
	 * Register the routes.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'my-jetpack/v1',
			'/site/onboarding/settled',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::settle',
					'permission_callback' => __CLASS__ . '::permissions_callback',
					'args'                => array(
						'outcome' => array(
							'description' => __( 'How the user left setup.', 'jetpack-my-jetpack' ),
							'type'        => 'string',
							'required'    => true,
							'enum'        => array( 'completed', 'skipped' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Who may settle setup.
	 *
	 * The same capability the takeover itself is gated on, since this is the record
	 * of a decision only someone who was shown it can have made.
	 *
	 * @return bool
	 */
	public static function permissions_callback() {
		return current_user_can( 'jetpack_connect' );
	}

	/**
	 * Record that setup has been settled, and how.
	 *
	 * Finishing is site-wide: the flow connects the site and switches modules on, so
	 * once it is done nobody needs the takeover again. Skipping is one person saying
	 * "not now" and is kept on that person, or the first admin to skip would answer
	 * for everyone else on a site nobody has set up.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response
	 */
	public static function settle( $request ) {
		$outcome = $request->get_param( 'outcome' );

		if ( 'completed' === $outcome ) {
			\Jetpack_Options::update_option( 'onboarding_completed', true );
		}

		// Recorded for a skip as well as a finish: someone who has been all the way
		// through should not be offered it again on their next visit either.
		update_user_meta(
			get_current_user_id(),
			Initializer::ONBOARDING_DISMISSED_USER_META,
			true
		);

		return rest_ensure_response(
			array(
				'completed' => (bool) \Jetpack_Options::get_option( 'onboarding_completed', false ),
				'settled'   => true,
			)
		);
	}
}
