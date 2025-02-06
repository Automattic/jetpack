<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Admin_Bar_Compatibility;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Invalidator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Always_Available_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Update_Cloud_CSS;

class Cloud_CSS implements Pluggable, Has_Always_Available_Endpoints, Changes_Page_Output, Optimization {

	/** User has requested regeneration manually or through activating the module. */
	const REGENERATE_REASON_USER_REQUEST = 'user_request';

	/** A post was updated/created. */
	const REGENERATE_REASON_SAVE_POST = 'save_post';

	/** A cornerstone page or the list of cornerstone pages was updated. */
	const REGENERATE_REASON_CORNERSTONE_UPDATE = 'cornerstone_update';

	/** Existing critical CSS invalidated because of a significant change, e.g. Theme changed. */
	const REGENERATE_REASON_INVALIDATED = 'invalidated';

	/** Requesting a regeneration because the previous request had failed and this is a followup attempt to regenerate Critical CSS. */
	const REGENERATE_REASON_FOLLOWUP = 'followup';

	/**
	 * Critical CSS storage class instance.
	 *
	 * @var Critical_CSS_Storage
	 */
	protected $storage;

	/**
	 * Critical CSS Provider Paths.
	 *
	 * @var Source_Providers
	 */
	protected $paths;

	public function __construct() {
		$this->storage = new Critical_CSS_Storage();
		$this->paths   = new Source_Providers();
	}

	public function setup() {
		add_action( 'wp', array( $this, 'display_critical_css' ) );
		add_action( 'save_post', array( $this, 'handle_save_post' ), 10, 2 );
		add_action( 'jetpack_boost_critical_css_invalidated', array( $this, 'handle_critical_css_invalidated' ) );
		add_filter( 'jetpack_boost_total_problem_count', array( $this, 'update_total_problem_count' ) );

		Generator::init();
		Critical_CSS_Invalidator::init();
		Cloud_CSS_Followup::init();

		return true;
	}

	/**
	 * Check if the module is ready and already serving critical CSS.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return ( new Critical_CSS_State() )->is_generated();
	}

	public static function is_available() {
		return true === Premium_Features::has_feature( Premium_Features::CLOUD_CSS );
	}

	public static function get_slug() {
		return 'cloud_css';
	}

	public function get_always_available_endpoints() {
		return array(
			new Update_Cloud_CSS(),
		);
	}

	public function display_critical_css() {

		// Don't look for Critical CSS in the dashboard.
		if ( is_admin() ) {
			return;
		}

		// Don't show Critical CSS in customizer previews.
		if ( is_customize_preview() ) {
			return;
		}

		// Don't display Critical CSS, if current page load is by the Critical CSS generator.
		if ( Generator::is_generating_critical_css() ) {
			return;
		}

		// Get the Critical CSS to show.
		$critical_css = $this->paths->get_current_request_css();
		if ( ! $critical_css ) {
			$keys    = $this->paths->get_current_request_css_keys();
			$pending = ( new Critical_CSS_State() )->has_pending_provider( $keys );

			// If Cloud CSS is still generating and the user is logged in, render the status information in a comment.
			if ( $pending && is_user_logged_in() ) {
				$display = new Display_Critical_CSS( '/* ' . __( 'Jetpack Boost is currently generating critical css for this page', 'jetpack-boost' ) . ' */' );
				add_action( 'wp_head', array( $display, 'display_critical_css' ), 0 );
			}
			return;
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG === true ) {
			$critical_css = "/* Critical CSS Key: {$this->paths->get_current_critical_css_key()} */\n" . $critical_css;
		}

		$display = new Display_Critical_CSS( $critical_css );
		add_action( 'wp_head', array( $display, 'display_critical_css' ), 0 );
		add_filter( 'style_loader_tag', array( $display, 'asynchronize_stylesheets' ), 10, 4 );
		add_action( 'wp_footer', array( $display, 'onload_flip_stylesheets' ) );

		// Ensure admin bar compatibility.
		Admin_Bar_Compatibility::init();
	}

	/**
	 * Create a Cloud CSS requests for provider groups.
	 *
	 * Initialize the Cloud CSS request. Provide $post parameter to limit generating to provider groups only associated
	 * with a specific post.
	 */
	public function generate_cloud_css( $reason, $providers = array() ) {
		$grouped_urls   = array();
		$grouped_ratios = array();

		foreach ( $providers as $source ) {
			$provider                    = $source['key'];
			$grouped_urls[ $provider ]   = $source['urls'];
			$grouped_ratios[ $provider ] = $source['success_ratio'];
		}

		// Send the request to the Cloud.
		$payload              = array(
			'providers'     => $grouped_urls,
			'successRatios' => $grouped_ratios,
		);
		$payload['requestId'] = md5( wp_json_encode( $payload ) . time() );
		$payload['reason']    = $reason;
		return Boost_API::post( 'cloud-css', $payload );
	}

	/**
	 * Handle regeneration of Cloud CSS when a post is saved.
	 */
	public function handle_save_post( $post_id, $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! $post || ! isset( $post->post_type ) || ! is_post_publicly_viewable( $post ) ) {
			return;
		}

		if ( Cornerstone_Utils::is_cornerstone_page( $post_id ) ) {
			$this->regenerate_cloud_css( self::REGENERATE_REASON_CORNERSTONE_UPDATE, $this->get_all_providers() );
			return;
		}

		// This checks against the latest providers list, not the list
		// stored in the database because newly added posts are always
		// included in the providers list that will be used to generate
		// the Cloud CSS.
		if ( $this->is_post_in_latest_providers_list( $post ) ) {
			$this->regenerate_cloud_css( self::REGENERATE_REASON_SAVE_POST, $this->get_all_providers( array( $post ) ) );
		}
	}

	/**
	 * Handle when a critical CSS environment change is detected.
	 */
	public function handle_environment_change( $is_major_change, $change_type ) {
		/*
		 * Regenerate Cloud CSS when the list of cornerstone pages is updated.
		 */
		if ( $change_type === Environment_Change_Detector::ENV_CHANGE_CORNERSTONE_PAGES_LIST_UPDATED ) {
			$this->regenerate_cloud_css( self::REGENERATE_REASON_CORNERSTONE_UPDATE, $this->get_all_providers() );
		}
	}

	public function regenerate_cloud_css( $reason, $providers ) {
		$result = $this->generate_cloud_css( $reason, $providers );
		if ( is_wp_error( $result ) ) {
			$state = new Critical_CSS_State();
			$state->set_error( $result->get_error_message() )->save();
		}
		return $result;
	}

	/**
	 * Check if the post is in the latest providers list.
	 *
	 * @param int|\WP_Post $post The post to check.
	 *
	 * @return bool
	 */
	public function is_post_in_latest_providers_list( $post ) {
		$post_link = get_permalink( $post );
		$providers = $this->get_all_providers();

		foreach ( $providers as $provider ) {
			if ( in_array( $post_link, $provider['urls'], true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Called when stored Critical CSS has been invalidated. Triggers a new Cloud CSS request.
	 */
	public function handle_critical_css_invalidated() {
		$this->regenerate_cloud_css( self::REGENERATE_REASON_INVALIDATED, $this->get_all_providers() );
		Cloud_CSS_Followup::schedule();
	}

	public function get_all_providers( $context_posts = array() ) {
		$source_providers = new Source_Providers();
		return $source_providers->get_provider_sources( $context_posts );
	}

	public function get_existing_sources() {
		$state = new Critical_CSS_State();
		$data  = $state->get();
		if ( ! empty( $data['providers'] ) ) {
			$providers = $data['providers'];
		} else {
			$providers = $this->get_all_providers();
		}

		return $providers;
	}

	/**
	 * Updates the total problem count for Boost if something's
	 * wrong with Cloud CSS.
	 *
	 * @param int $count The current problem count.
	 *
	 * @return int
	 */
	public function update_total_problem_count( $count ) {
		return ( new Critical_CSS_State() )->has_errors() ? ++$count : $count;
	}
}
