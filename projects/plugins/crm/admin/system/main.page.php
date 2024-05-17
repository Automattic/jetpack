<?php
/*
!
 * Main System Page file: This is the main file which controls the different pages in the System section and renders the layout
 * Jetpack CRM - https://jetpackcrm.com
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

// permissions check
if ( ! current_user_can( 'admin_zerobs_manage_options' ) ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) );
}

/**
 * Render the assistant page
 */
function zeroBSCRM_render_systemassistant() {

	require_once 'assistant.page.php';
}
/**
 * Render the assistant page
 */
function zeroBSCRM_render_systemstatus() {

	require_once 'system-status.page.php';
}

/**
 * Render the placeholder map page
 */
function zeroBSCRM_render_placeholdermap() {

	require_once 'placeholder-map.page.php';
}

/**
 * Render the title of the system page
 *
 * @param string $title
 */
function jpcrm_render_system_title( $title = '', $settings_rightfloated_notice = false ) {

	if ( ! empty( $title ) ) {
		include 'partials/title.block.php';
	}
}

// create tab list and their params
$tabs = array(
	'assistant'       => array(
		'tab_name' => __( 'Assistant', 'zero-bs-crm' ),
		'title'    => __( 'System Assistant', 'zero-bs-crm' ),
		'renderfn' => 'zeroBSCRM_render_systemassistant',
	),
	'status'          => array(
		'tab_name' => __( 'System Status', 'zero-bs-crm' ),
		'title'    => __( 'System Status', 'zero-bs-crm' ),
		'renderfn' => 'zeroBSCRM_render_systemstatus',
	),
	'placeholder-map' => array(
		'tab_name' => __( 'Placeholder Map', 'zero-bs-crm' ),
		'title'    => __( 'Placeholders', 'zero-bs-crm' ),
		'renderfn' => 'zeroBSCRM_render_placeholdermap',
	),
);

$active_tab = '';

// retrieve active tab
if ( isset( $_GET['tab'] ) ) {
	$active_tab = sanitize_text_field( $_GET['tab'] );
}

// set fallback tab
if ( ! isset( $tabs[ $active_tab ] ) ) {
	$active_tab = 'assistant';
}

?>

<div id="jpcrm-system-manager" style="margin:1em;">

	<div class="ui top attached tabular menu">

		<?php foreach ( $tabs as $k => $v ) : ?>
			<div data-tab="<?php echo esc_attr( $k ); ?>" class="<?php echo $active_tab == $k ? 'active ' : ''; ?>item"><?php echo esc_html( $v['tab_name'] ); ?></div>
		<?php endforeach; ?>

	</div>

	<?php foreach ( $tabs as $k => $v ) : ?>
		<div class="ui bottom attached <?php echo $active_tab == $k ? 'active ' : ''; ?>tab segment" data-tab="<?php echo esc_attr( $k ); ?>">

			<?php call_user_func( $v['renderfn'] ); ?>

		</div>
	<?php endforeach; ?>

</div>
