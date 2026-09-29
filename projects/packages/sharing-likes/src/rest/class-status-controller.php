<?php
/**
 * The section states behind Settings > Sharing, and the actions that change them.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Sharing_Likes\Settings\Environment;
use Automattic\Jetpack\Sharing_Likes\Settings\Feature_Actions;
use Automattic\Jetpack\Sharing_Likes\Settings\Likes_Section;
use Automattic\Jetpack\Sharing_Likes\Settings\Placement_Section;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_State;
use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Which variant each section renders, plus "Switch to the … block" and "Turn on".
 *
 * Each action is only accepted from the variant that offers it, so the API opens
 * no door the screen keeps shut. The actions answer with the new status, so the
 * screen can re-render without asking again.
 */
final class Status_Controller extends Controller {

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		$base     = '/' . Endpoints::BASE;
		$features = array( Placement_Section::FEATURE_SHARING, Placement_Section::FEATURE_LIKES );
		$feature  = '(?P<feature>' . implode( '|', $features ) . ')';
		// Route matching ignores case, and a body or query `feature` would outrank the URL's.
		$args = array(
			'feature' => array(
				'type' => 'string',
				'enum' => $features,
			),
		);

		register_rest_route(
			$this->namespace,
			$base . '/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_status' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$base . '/' . $feature . '/switch-to-block',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'switch_to_block' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => $args,
			)
		);

		register_rest_route(
			$this->namespace,
			$base . '/' . $feature . '/activate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'activate' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => $args,
			)
		);
	}

	/**
	 * The variant each section renders.
	 *
	 * @return WP_REST_Response
	 */
	public function get_status() {
		$sharing_state        = Sharing_Section::state();
		$likes_state          = Likes_Section::state();
		$comment_likes_follow = Environment::comment_likes_follow_likes_settings();

		return rest_ensure_response(
			array(
				'sharing'         => array(
					'state' => $sharing_state,
				),
				'likes'           => array(
					'state'     => $likes_state,
					'supported' => Environment::likes_supported(),
				),
				// No variants: comments have no block to move to.
				'comment_likes'   => array(
					'supported'              => Environment::likes_supported(),
					'follows_likes_settings' => $comment_likes_follow,
				),
				'placement'       => Section_State::shows_placement( $sharing_state, $likes_state, $comment_likes_follow ),
				'site_editor_url' => Environment::single_template_editor_url(),
			)
		);
	}

	/**
	 * Hand a feature over to its block.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function switch_to_block( $request ) {
		$feature = $request->get_url_params()['feature'];
		$refused = self::refuse_unless( $feature, Section_State::CONFIGURE_WITH_BLOCK_NUDGE );

		if ( $refused ) {
			return $refused;
		}

		Feature_Actions::switch_to_block( $feature );

		return $this->get_status();
	}

	/**
	 * Turn a feature's module back on.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function activate( $request ) {
		$feature = $request->get_url_params()['feature'];
		$refused = self::refuse_unless( $feature, Section_State::OFF );

		if ( $refused ) {
			return $refused;
		}

		if ( ! Feature_Actions::activate( $feature ) ) {
			return new WP_Error(
				'rest_sharing_likes_activation_failed',
				__( 'The feature could not be turned on.', 'jetpack-sharing-likes' ),
				array( 'status' => 409 )
			);
		}

		return $this->get_status();
	}

	/**
	 * An error unless the feature's section renders the variant that offers the action.
	 *
	 * @param string $feature One of the `Placement_Section::FEATURE_*` constants.
	 * @param string $state   The `Section_State` constant that offers the action.
	 * @return WP_Error|null
	 */
	private static function refuse_unless( string $feature, string $state ): ?WP_Error {
		$is_likes = Placement_Section::FEATURE_LIKES === $feature;

		// Without the connection (or offline mode) their modules need, neither section offers an action.
		if ( $is_likes ? ! Environment::likes_supported() : ! Environment::legacy_sharing_supported() ) {
			$current = null;
		} else {
			$current = $is_likes ? Likes_Section::state() : Sharing_Section::state();
		}

		if ( $state === $current ) {
			return null;
		}

		return new WP_Error(
			'rest_sharing_likes_action_unavailable',
			__( 'This action is not available on this site right now.', 'jetpack-sharing-likes' ),
			array( 'status' => 409 )
		);
	}
}
