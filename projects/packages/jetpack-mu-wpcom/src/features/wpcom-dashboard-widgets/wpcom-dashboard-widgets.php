<?php
/**
 * Load the widgets of Dashboard for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-plugins
 */

/**
 * Load all wpcom dashboard widgets.
 */
function load_wpcom_dashboard_widgets() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	enqueue_wpcom_dashboard_widgets();

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
 */
function enqueue_wpcom_dashboard_widgets() {
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
