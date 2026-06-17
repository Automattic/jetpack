<?php
/**
 * AI Launchpad REST endpoints.
 *
 * @package automattic/jetpack-mu-wpcom
 * @since $$next-version$$
 */

/**
 * REST endpoints for the AI Launchpad wizard and AI output options.
 */
class AI_Launchpad_REST extends WP_REST_Controller {

	const OPTION_WIZARD    = 'wpcom_ai_launchpad_wizard';
	const OPTION_AI_OUTPUT = 'wpcom_ai_launchpad_ai_output';
	const OPTION_DISMISSED = 'wpcom_ai_launchpad_dismissed';

	const MIN_VALID_TASKS = 4;

	const LAUNCH_TASK_IDS = array( 'site_launched', 'blog_launched', 'woo_launch_site', 'link_in_bio_launched', 'videopress_launched' );

	/**
	 * Class constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'ai-launchpad';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_data' ),
					'permission_callback' => array( $this, 'can_read' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'dismiss' ),
					'permission_callback' => array( $this, 'can_write' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/wizard',
			array(
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'update_wizard' ),
					'permission_callback' => array( $this, 'can_write' ),
					'args'                => array(
						'goal'        => array(
							'description' => 'The site goal picked in the wizard.',
							'type'        => 'string',
							'enum'        => array( 'write', 'build', 'sell', 'newsletter', 'educate', 'portfolio' ),
							'required'    => true,
						),
						'site_name'   => array(
							'description'       => 'The site name entered in the wizard.',
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'description' => array(
							'description'       => 'The free-text site description entered in the wizard.',
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_textarea_field',
						),
						'locale'      => array(
							'description'       => 'The user locale.',
							'type'              => 'string',
							'default'           => 'en',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/tailored',
			array(
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'update_tailored' ),
					'permission_callback' => array( $this, 'can_write' ),
					'args'                => array(
						'source' => array(
							'description' => 'Whether the payload came from the AI or the deterministic fallback. Query parameter; the JSON body must match the agent output schema exactly.',
							'type'        => 'string',
							'enum'        => array( 'ai', 'fallback' ),
							'default'     => 'ai',
						),
					),
				),
			)
		);
	}

	/**
	 * Permission callback for reads.
	 *
	 * @return true|WP_Error|false
	 */
	public function can_read() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return false;
		}

		return $this->check_eligibility();
	}

	/**
	 * Permission callback for writes.
	 *
	 * @return true|WP_Error|false
	 */
	public function can_write() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return $this->check_eligibility();
	}

	/**
	 * Returns a 404 error for ineligible sites, true otherwise.
	 *
	 * The eligibility gate itself is owned by the AI Launchpad loader.
	 *
	 * @return true|WP_Error
	 */
	private function check_eligibility() {
		// Fail closed: if the gate is unavailable for any reason, treat the site
		// as not eligible rather than exposing the endpoint to every capable user.
		if ( ! function_exists( 'wpcom_ai_launchpad_is_eligible' ) || ! wpcom_ai_launchpad_is_eligible() ) {
			return new WP_Error(
				'ai_launchpad_not_eligible',
				__( 'This site is not eligible for the AI Launchpad.', 'jetpack-mu-wpcom' ),
				array( 'status' => 404 )
			);
		}

		return true;
	}

	/**
	 * Composite read: wizard payload, AI output, enriched tasks, statuses, and eligibility.
	 *
	 * @return array
	 */
	public function get_data() {
		$wizard    = get_option( self::OPTION_WIZARD );
		$ai_output = get_option( self::OPTION_AI_OUTPUT );

		// Guard the nested payload: partial/legacy/failed writes may leave the
		// option as an array without payload.tasks, which would warn and break.
		$tasks = array();
		if ( is_array( $ai_output ) && isset( $ai_output['payload']['tasks'] ) && is_array( $ai_output['payload']['tasks'] ) ) {
			$tasks = $this->build_tasks( $ai_output['payload']['tasks'] );
		}

		return array(
			'wizard'             => is_array( $wizard ) ? $wizard : null,
			'ai_output'          => is_array( $ai_output ) ? $ai_output : null,
			'tasks'              => $tasks,
			'checklist_statuses' => (array) get_option( 'launchpad_checklist_tasks_statuses', array() ),
			'dismissed'          => (bool) get_option( self::OPTION_DISMISSED, false ),
			'is_eligible'        => true,
		);
	}

	/**
	 * Persists the wizard input to the wizard option.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array
	 */
	public function update_wizard( $request ) {
		$wizard = array(
			'version'      => 1,
			'goal'         => $request['goal'],
			'site_name'    => $request['site_name'],
			'description'  => $request['description'],
			'locale'       => $request['locale'],
			'generated_at' => time(),
		);

		update_option( self::OPTION_WIZARD, $wizard, false );

		return array( 'wizard' => $wizard );
	}

	/**
	 * Validates the AI output payload against the agent output schema, wraps it, and persists it.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array|WP_Error
	 */
	public function update_tailored( $request ) {
		$payload = $request->get_json_params();

		$validation = rest_validate_value_from_schema( $payload, $this->get_output_schema(), 'payload' );
		if ( is_wp_error( $validation ) ) {
			return new WP_Error( 'ai_launchpad_invalid_payload', $validation->get_error_message(), array( 'status' => 422 ) );
		}

		$last_task = end( $payload['tasks'] );
		if ( ! in_array( $last_task['id'], self::LAUNCH_TASK_IDS, true ) ) {
			return new WP_Error(
				'ai_launchpad_missing_launch_task',
				__( 'The last task must be a launch task.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		$definitions = wpcom_launchpad_get_task_definitions();
		$tasks       = array();

		foreach ( $payload['tasks'] as $task ) {
			if ( ! isset( $definitions[ $task['id'] ] ) ) {
				continue;
			}

			$subtitle = $this->sanitize_subtitle( $task['subtitle'] );
			if ( is_wp_error( $subtitle ) ) {
				return $subtitle;
			}

			$tasks[] = array(
				'id'       => $task['id'],
				'subtitle' => $subtitle,
			);
		}

		if ( count( $tasks ) < self::MIN_VALID_TASKS ) {
			return new WP_Error(
				'ai_launchpad_unknown_tasks',
				__( 'Too few tasks matched the task catalog.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		$payload['tasks'] = $tasks;

		$ai_output = array(
			'version'      => 1,
			'source'       => $request['source'],
			'generated_at' => time(),
			'payload'      => $payload,
		);

		update_option( self::OPTION_AI_OUTPUT, $ai_output, false );

		return array( 'ai_output' => $ai_output );
	}

	/**
	 * Deletes the AI output and marks the AI Launchpad as dismissed.
	 *
	 * @return array
	 */
	public function dismiss() {
		delete_option( self::OPTION_AI_OUTPUT );
		update_option( self::OPTION_DISMISSED, true, true );

		return array( 'dismissed' => true );
	}

	/**
	 * Strips HTML from a subtitle and rejects URLs and template syntax.
	 *
	 * @param string $subtitle The raw subtitle.
	 * @return string|WP_Error The sanitized subtitle, or an error.
	 */
	private function sanitize_subtitle( $subtitle ) {
		$subtitle = trim( wp_strip_all_tags( $subtitle, true ) );

		if ( '' === $subtitle ) {
			return new WP_Error(
				'ai_launchpad_invalid_subtitle',
				__( 'Task subtitles must contain text.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		if ( preg_match( '#https?://#i', $subtitle ) ) {
			return new WP_Error(
				'ai_launchpad_subtitle_contains_url',
				__( 'Task subtitles must not contain URLs.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		if ( str_contains( $subtitle, '{{' ) || str_contains( $subtitle, '[[' ) ) {
			return new WP_Error(
				'ai_launchpad_subtitle_contains_template',
				__( 'Task subtitles must not contain template syntax.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		return mb_substr( $subtitle, 0, 200 );
	}

	/**
	 * Enriches the persisted tasks with title, completion state, and CTA path from the catalog.
	 *
	 * @param array $tasks The persisted `payload.tasks` array.
	 * @return array
	 */
	private function build_tasks( $tasks ) {
		$definitions = wpcom_launchpad_get_task_definitions();
		$built       = array();

		foreach ( $tasks as $task ) {
			if ( ! is_array( $task ) || ! isset( $task['id'] ) || ! isset( $task['subtitle'] ) ) {
				continue;
			}

			if ( ! isset( $definitions[ $task['id'] ] ) ) {
				continue;
			}

			$definition       = $definitions[ $task['id'] ];
			$definition['id'] = $task['id'];

			$built[] = array(
				'id'           => $task['id'],
				'subtitle'     => $task['subtitle'],
				'title'        => isset( $definition['get_title'] ) ? $definition['get_title']() : '',
				'completed'    => wpcom_launchpad_checklists()->is_task_complete( $definition ),
				'calypso_path' => $this->load_calypso_path( $definition ),
			);
		}

		return $built;
	}

	/**
	 * Loads the CTA path for a task from its `get_calypso_path` callback.
	 *
	 * @param array $task The task definition, including its `id`.
	 * @return string|null
	 */
	private function load_calypso_path( $task ) {
		if ( ! isset( $task['get_calypso_path'] ) || ! is_callable( $task['get_calypso_path'] ) ) {
			return null;
		}

		$site_slug = wpcom_get_site_slug();
		$data      = array(
			'site_slug'         => $site_slug,
			'site_slug_encoded' => rawurlencode( $site_slug ),
			'launchpad_context' => null,
		);

		$path = call_user_func( $task['get_calypso_path'], $task, null, $data );

		if ( ! is_string( $path ) || '' === $path || ! $this->is_valid_calypso_path( $path ) ) {
			return null;
		}

		return $path;
	}

	/**
	 * Validates a task's CTA path before it reaches the client. Mirrors
	 * Launchpad_Task_Lists::is_valid_admin_url_or_absolute_path() (private there),
	 * so protocol-relative or otherwise malformed paths are rejected here too.
	 *
	 * @param string $path The candidate path.
	 * @return bool
	 */
	private function is_valid_calypso_path( $path ) {
		// Stripe connection URLs for the set_up_payments task.
		if ( str_starts_with( $path, 'https://connect.stripe.com' ) ) {
			return true;
		}

		// Absolute admin URLs.
		if ( str_starts_with( $path, admin_url() ) ) {
			return true;
		}

		// Absolute paths, but not protocol-relative (`//…`) URLs.
		return str_starts_with( $path, '/' ) && ! str_starts_with( $path, '//' );
	}

	/**
	 * Loads the agent output schema used to validate `PUT /tailored` bodies.
	 *
	 * @return array
	 */
	private function get_output_schema() {
		static $schema = null;

		if ( null === $schema ) {
			$schema = json_decode( file_get_contents( __DIR__ . '/contracts/agent-output-schema.json' ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
		}

		return $schema;
	}
}

// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
new AI_Launchpad_REST();
