<?php
/**
 * The settings route behind Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use Automattic\Jetpack\Sharing_Likes\Settings\Environment;
use Automattic\Jetpack\Sharing_Likes\Settings\Likes_Options;
use Automattic\Jetpack\Sharing_Likes\Settings\Likes_Section;
use Automattic\Jetpack\Sharing_Likes\Settings\Placement_Section;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_State;
use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Options;
use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Resources;
use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section;
use Automattic\Jetpack\Sharing_Likes\Settings\Twitter_Site_Tag;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Reads and saves every setting the screen shows, and only those.
 *
 * Which settings a site gets follows the PHP screen: a setting its section does not
 * render is left out of reads and refused on writes. That keeps the API from offering
 * a way back where `BLOCK_CALL_TO_ACTION` deliberately has none.
 */
final class Settings_Controller extends Controller {

	/**
	 * The options `Sharing_Options::update()` saves together.
	 */
	private const SHARING_OPTIONS = array( 'button_style', 'sharing_label', 'open_links' );

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . Endpoints::BASE . '/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
			)
		);
	}

	/**
	 * Every setting this site's screen shows.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		unset( $request );

		return rest_ensure_response( self::read( self::available_settings() ) );
	}

	/**
	 * Save the settings the request carries and leave every other one as stored.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$sent = array();

		foreach ( array_keys( $this->get_item_schema()['properties'] ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$sent[ $key ] = $request->get_param( $key );
			}
		}

		$unavailable = array_values( array_diff( array_keys( $sent ), self::available_settings() ) );

		if ( $unavailable ) {
			return new WP_Error(
				'rest_sharing_likes_setting_unavailable',
				/* translators: %s: comma-separated list of setting names. */
				sprintf( __( 'These settings are not available on this site: %s.', 'jetpack-sharing-likes' ), implode( ', ', $unavailable ) ),
				array(
					'status' => 400,
					'params' => $unavailable,
				)
			);
		}

		$sharing = array_intersect_key( $sent, array_flip( self::SHARING_OPTIONS ) );

		if ( $sharing ) {
			// `set_global_options()` unslashes the label, as it was written for `$_POST`.
			if ( isset( $sharing['sharing_label'] ) ) {
				$sharing['sharing_label'] = wp_slash( $sharing['sharing_label'] );
			}

			Sharing_Options::update( $sharing );
		}

		// After the sharing options, which rewrite the global array placement lives in.
		if ( isset( $sent['show'] ) ) {
			Placement_Section::update( $sent['show'] );
		}

		if ( isset( $sent['likes_enabled'] ) ) {
			Likes_Options::set_likes_enabled( $sent['likes_enabled'] );
		}

		if ( isset( $sent['reblogs_enabled'] ) ) {
			Likes_Options::set_reblogs_enabled( $sent['reblogs_enabled'] );
		}

		if ( isset( $sent['comment_likes_enabled'] ) ) {
			Likes_Options::set_comment_likes_enabled( $sent['comment_likes_enabled'] );
		}

		if ( isset( $sent['twitter_site_tag'] ) ) {
			Twitter_Site_Tag::update( $sent['twitter_site_tag'] );
		}

		if ( isset( $sent['disable_resources'] ) ) {
			Sharing_Resources::update( $sent['disable_resources'] );
		}

		return $this->get_item( $request );
	}

	/**
	 * The settings the screen shows on this site, following the sections that render them.
	 *
	 * @return string[]
	 */
	private static function available_settings(): array {
		$sharing_state = Sharing_Section::state();
		$likes_state   = Likes_Section::state();
		$is_simple     = Environment::is_simple_site();
		$settings      = array();

		if ( Section_State::configures( $likes_state ) ) {
			$settings[] = 'likes_enabled';

			if ( $is_simple ) {
				$settings[] = 'reblogs_enabled';
			}
		}

		// Comments have no Like block to move to, so the switch leaves this one in place.
		if ( $is_simple ) {
			$settings[] = 'comment_likes_enabled';
		}

		if ( Sharing_Options::is_available() && Section_State::configures( $sharing_state ) ) {
			array_push( $settings, ...self::SHARING_OPTIONS );
		}

		if ( Section_State::shows_placement( $sharing_state, $likes_state ) ) {
			$settings[] = 'show';
		}

		if ( Twitter_Site_Tag::is_available() ) {
			$settings[] = 'twitter_site_tag';
		}

		if ( Sharing_Resources::is_available() ) {
			$settings[] = 'disable_resources';
		}

		return $settings;
	}

	/**
	 * Current values of the given settings.
	 *
	 * @param string[] $settings Setting names.
	 * @return array<string, mixed>
	 */
	private static function read( array $settings ): array {
		$values = array();

		if ( array_intersect( self::SHARING_OPTIONS, $settings ) ) {
			$values = Sharing_Options::get();
		}

		$values['likes_enabled']         = Likes_Options::likes_enabled_sitewide();
		$values['reblogs_enabled']       = Likes_Options::reblogs_enabled_sitewide();
		$values['comment_likes_enabled'] = Likes_Options::comment_likes_enabled();
		$values['show']                  = Placement_Section::selected_post_types();
		$values['twitter_site_tag']      = (string) get_option( Twitter_Site_Tag::OPTION, '' );
		$values['disable_resources']     = (bool) get_option( Sharing_Resources::OPTION );

		return array_intersect_key( $values, array_flip( $settings ) );
	}

	/**
	 * The settings record.
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->schema;
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'sharing-likes-settings',
			'type'       => 'object',
			'properties' => array(
				'likes_enabled'         => array(
					'description' => __( 'Whether posts show Like buttons.', 'jetpack-sharing-likes' ),
					'type'        => 'boolean',
				),
				'reblogs_enabled'       => array(
					'description' => __( 'Whether posts show Reblog buttons. WordPress.com Simple only.', 'jetpack-sharing-likes' ),
					'type'        => 'boolean',
				),
				'comment_likes_enabled' => array(
					'description' => __( 'Whether comments can be liked. WordPress.com Simple only.', 'jetpack-sharing-likes' ),
					'type'        => 'boolean',
				),
				'button_style'          => array(
					'description' => __( 'How sharing buttons look.', 'jetpack-sharing-likes' ),
					'type'        => 'string',
					'enum'        => Sharing_Options::BUTTON_STYLES,
				),
				'sharing_label'         => array(
					'description' => __( 'Text shown above the sharing buttons.', 'jetpack-sharing-likes' ),
					'type'        => 'string',
				),
				'open_links'            => array(
					'description' => __( 'Whether sharing links open in the same window or a new one.', 'jetpack-sharing-likes' ),
					'type'        => 'string',
					'enum'        => Sharing_Options::OPEN_LINKS,
				),
				'show'                  => array(
					'description' => __( 'Post types the buttons appear on, plus "index" for the front page, archives and search results.', 'jetpack-sharing-likes' ),
					'type'        => 'array',
					'items'       => array( 'type' => 'string' ),
				),
				'twitter_site_tag'      => array(
					'description' => __( 'X (Twitter) username of the site owner, without the @.', 'jetpack-sharing-likes' ),
					'type'        => 'string',
				),
				'disable_resources'     => array(
					'description' => __( 'Whether the sharing buttons skip their own CSS and JS.', 'jetpack-sharing-likes' ),
					'type'        => 'boolean',
				),
			),
		);

		return $this->schema;
	}
}
