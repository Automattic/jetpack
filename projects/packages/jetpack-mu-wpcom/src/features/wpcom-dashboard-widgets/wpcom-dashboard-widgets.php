<?php
/**
 * Load the widgets of Dashboard for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-plugins
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Load all wpcom dashboard widgets.
 */
function load_wpcom_dashboard_widgets() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// wpcom_json_api_request_as_user does not support internal requests.
	$request = defined( 'IS_WPCOM' ) && IS_WPCOM ? 'wpcom_json_api_request_as_blog' : 'wpcom_json_api_request_as_user';

	$layout_response = Client::$request(
		'/sites/' . get_wpcom_blog_id() . '/home/layout',
		'v2',
		array(),
		null,
		'wpcom'
	);

	$tasks = array();

	if ( ! is_wp_error( $layout_response ) ) {
		$layout = json_decode( $layout_response['body'], true );
		if ( isset( $layout['secondary'] ) && is_array( $layout['secondary'] ) ) {
			// If there's an array within the secondary section, it's the task
			// list.
			foreach ( $layout['secondary'] as $item ) {
				if ( is_array( $item ) ) {
					// Delete any tasks that don't have a corresponding PHP file.
					foreach ( $item as $task ) {
						if ( file_exists( __DIR__ . '/wpcom-general-tasks-widget/tasks/' . $task ) ) {
							$tasks[] = $task;
						}
					}
					break;
				}
			}
		}
	}

	enqueue_wpcom_dashboard_widgets( array( 'tasks' => $tasks ) );

	$wpcom_dashboard_widgets = array(
		array(
			'id'       => 'wpcom_site_preview_widget',
			'name'     => __( 'Site', 'jetpack-mu-wpcom' ),
			'context'  => 'side',
			'priority' => 'high',
		),
		array(
			'id'       => 'wpcom_daily_writing_prompt',
			'name'     => __( 'Daily Writing Prompt', 'jetpack-mu-wpcom' ),
			'context'  => 'side',
			'priority' => 'high',
		),
	);

	$launchpad_context = 'customer-home';
	$checklist_slug    = get_option( 'site_intent' );

	if (
		get_option( 'launch-status', 'launched' ) !== 'launched' &&
		! empty( wpcom_get_launchpad_checklist_by_checklist_slug( $checklist_slug, $launchpad_context ) ) &&
		! wpcom_launchpad_is_task_list_dismissed( $checklist_slug )
	) {
		$wpcom_dashboard_widgets[] = array(
			'id'       => 'wpcom_launchpad_widget',
			'name'     => __( 'Site Setup', 'jetpack-mu-wpcom' ),
			'context'  => 'normal',
			'priority' => 'high',
		);
	}

	if ( ! empty( $tasks ) ) {
		$wpcom_dashboard_widgets[] = array(
			'id'       => 'wpcom_general_tasks_widget',
			'name'     => __( 'Suggestions', 'jetpack-mu-wpcom' ),
			'context'  => 'normal',
			'priority' => 'high',
		);
	}

	foreach ( $wpcom_dashboard_widgets as $wpcom_dashboard_widget ) {
		wp_add_dashboard_widget(
			$wpcom_dashboard_widget['id'],
			$wpcom_dashboard_widget['name'],
			'render_wpcom_dashboard_widget',
			null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. See https://core.trac.wordpress.org/ticket/52539.
			array(
				'id'   => $wpcom_dashboard_widget['id'],
				'name' => $wpcom_dashboard_widget['name'],
			),
			$wpcom_dashboard_widget['context'],
			$wpcom_dashboard_widget['priority']
		);
	}
}
add_action( 'wp_dashboard_setup', 'load_wpcom_dashboard_widgets' );

/**
 * Enqueue the assets of the wpcom dashboard widgets.
 *
 * @param array $args Settings to pass.
 */
function enqueue_wpcom_dashboard_widgets( $args = array() ) {
	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-dashboard-widgets', array( 'js', 'css' ) );

	$bundles      = wp_list_filter( wpcom_get_site_purchases(), array( 'product_type' => 'bundle' ) );
	$current_plan = array_pop( $bundles );

	$data = wp_json_encode(
		array(
			'siteName'        => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			'siteUrl'         => home_url(),
			'siteIconUrl'     => get_site_icon_url( 38 ),
			'isBlockTheme'    => wp_is_block_theme(),
			'siteDomain'      => wp_parse_url( home_url(), PHP_URL_HOST ),
			'siteIntent'      => get_option( 'site_intent' ),
			'sitePlan'        => $current_plan,
			'hasCustomDomain' => wpcom_site_has_feature( 'custom-domain' ),
			'tasks'           => $args['tasks'],
		)
	);

	wp_add_inline_script(
		$handle,
		"var JETPACK_MU_WPCOM_DASHBOARD_WIDGETS = $data;var configData = {};",
		'before'
	);
}

/**
 * Render the container of the wpcom dashboard widget.
 *
 * @param WP_Post $post The post object.
 * @param array   $callback_args The callback args of the render function.
 */
function render_wpcom_dashboard_widget( $post, $callback_args ) {
	$args         = $callback_args['args'];
	$widget_id    = $args['id'] . '_main';
	$widget_class = $args['class'] ?? $args['id'];
	$widget_name  = $args['name'];

	$warning = sprintf(
		/* translators: The name of the widget. */
		__( 'Your %s widget requires JavaScript to function properly.', 'jetpack-mu-wpcom' ),
		$widget_name
	);

	?>
	<div>
		<div class="hide-if-js">
			<?php echo esc_html( $warning ); ?>
		</div>
		<div
			id="<?php echo esc_attr( $widget_id ); ?>"
			class="<?php echo esc_attr( $widget_class ); ?> hide-if-no-js"
			style="height: 100%">
		</div>
	</div>
	<?php
}
