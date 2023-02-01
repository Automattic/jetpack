<?php

function jetpack_boost_page_optimize_settings_page() {
	?>
	<div class="wrap">
		<h1><?php _e( 'Performance Settings', jetpack_boost_page_optimize_get_text_domain() ); ?></h1>
		<form method="post" action="options.php">
			<?php
			settings_fields( 'performance' );
			do_settings_sections( 'jetpack-boost-page-optimize' );
			submit_button();
			?>
		</form>
	</div>
	<?php
}

function jetpack_boost_page_optimize_settings_section() {
	_e(
		'Concatenating JavaScript and CSS for faster site loading and lower number of requests. Scripts are grouped by the original placement.',
		jetpack_boost_page_optimize_get_text_domain()
	);
	echo '<br />';
	_e(
		'This plugin disables Jetpack "Speed up static file load times".',
		jetpack_boost_page_optimize_get_text_domain()
	);
}

function jetpack_boost_page_optimize_settings_field_js( $args ) {
	?>
	<fieldset>
		<label>
			<input type="checkbox" id="page_optimize-js" name="page_optimize-js" value="1" <?php checked( get_option( 'page_optimize-js' ) ); ?>>
			<?php _e( 'Concatenate scripts', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</label>
		<br>
		<label for="page_optimize-js-exclude">
			<?php _e( 'Comma separated list of strings to exclude from JS concatenating:', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</label>
		<br>
		<input type="text"
			id="page_optimize-js-exclude"
			name="page_optimize-js-exclude"
			value="<?php echo esc_html( get_option( 'page_optimize-js-exclude' ) ); ?>"
			class="regular-text ltr">
	</fieldset>
	<?php
}

function jetpack_boost_page_optimize_settings_field_js_load_mode( $args ) {
	?>
	<fieldset>
		<label>
			<input type="radio" name="page_optimize-load-mode" value="" <?php checked( '', get_option( 'page_optimize-load-mode' ), true ); ?>>
			<?php _e( 'None', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</label>
		<label>
			<input type="radio" name="page_optimize-load-mode" value="async" <?php checked( 'async', get_option( 'page_optimize-load-mode' ), true ); ?>>
			<?php _e( 'Async', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</label>
		<label>
			<input type="radio" name="page_optimize-load-mode" value="defer" <?php checked( 'defer', get_option( 'page_optimize-load-mode' ), true ); ?>>
			<?php _e( 'Defer', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</label>

		<p class="description">
			<?php _e( 'You can choose the execution mode of the concatenated JavaScript. <strong>This option might break your site, so use carefully.</strong>', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</p>
	</fieldset>
	<?php
}

function jetpack_boost_page_optimize_settings_field_css( $args ) {
	?>
	<fieldset>
		<label>
			<input type="checkbox" id="page_optimize-css" name="page_optimize-css" value="1" <?php checked( get_option( 'page_optimize-css' ) ); ?>>
			<?php _e( 'Concatenate styles', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</label>
		<br>
		<label for="page_optimize-css-exclude">
			<?php _e( 'Comma separated list of strings to exclude from CSS concatenating:', jetpack_boost_page_optimize_get_text_domain() ); ?>
		</label>
		<br>
		<input type="text"
			id="page_optimize-css-exclude"
			name="page_optimize-css-exclude"
			value="<?php echo esc_html( get_option( 'page_optimize-css-exclude' ) ); ?>"
			class="regular-text ltr">
	</fieldset>
	<?php
}

function jetpack_boost_page_optimize_settings_add_menu() {
	add_options_page(
		__( 'Performance Settings', jetpack_boost_page_optimize_get_text_domain() ),
		__( 'Performance', jetpack_boost_page_optimize_get_text_domain() ),
		'manage_options',
		'jetpack-boost-page-optimize',
		'jetpack_boost_page_optimize_settings_page'
	);
}

add_action( 'admin_menu', 'jetpack_boost_page_optimize_settings_add_menu' );

function jetpack_boost_page_optimize_settings_init() {
	register_setting(
		'performance',
		'page_optimize-js',
		array(
			'description' => __( 'JavaScript concatenation', jetpack_boost_page_optimize_get_text_domain() ),
			'type' => 'boolean',
			'default' => jetpack_boost_page_optimize_js_default(),
		)
	);
	register_setting(
		'performance',
		'page_optimize-load-mode',
		array(
			'description' => __( 'Non-critical script execution mode', jetpack_boost_page_optimize_get_text_domain() ),
			'type' => 'string',
			'default' => jetpack_boost_page_optimize_js_load_mode_default(),
			'sanitize_callback' => 'jetpack_boost_page_optimize_sanitize_js_load_mode',
		)
	);
	register_setting(
		'performance',
		'page_optimize-js-exclude',
		array(
			'description' => __( 'Comma separated list of strings to exclude from JS concatenating', jetpack_boost_page_optimize_get_text_domain() ),
			'type' => 'string',
			'default' => implode( ',', jetpack_boost_page_optimize_js_exclude_list_default() ),
			'sanitize_callback' => 'jetpack_boost_page_optimize_sanitize_exclude_field',
		)
	);
	register_setting(
		'performance',
		'page_optimize-css',
		array(
			'description' => __( 'CSS concatenation', jetpack_boost_page_optimize_get_text_domain() ),
			'type' => 'boolean',
			'default' => jetpack_boost_page_optimize_css_default(),
		)
	);
	register_setting(
		'performance',
		'page_optimize-css-exclude',
		array(
			'description' => __( 'Comma separated list of strings to exclude from CSS concating', jetpack_boost_page_optimize_get_text_domain() ),
			'type' => 'string',
			'default' => implode( ',', jetpack_boost_page_optimize_css_exclude_list_default() ),
			'sanitize_callback' => 'jetpack_boost_page_optimize_sanitize_exclude_field',
		)
	);

	add_settings_section(
		'jetpack_boost_page_optimize_settings_section',
		__( 'Page Optimization', jetpack_boost_page_optimize_get_text_domain() ),
		'jetpack_boost_page_optimize_settings_section',
		'jetpack-boost-page-optimize'
	);
	add_settings_field(
		'jetpack_boost_page_optimize_js',
		__( 'JavaScript', jetpack_boost_page_optimize_get_text_domain() ),
		'jetpack_boost_page_optimize_settings_field_js',
		'jetpack-boost-page-optimize',
		'jetpack_boost_page_optimize_settings_section'
	);
	add_settings_field(
		'jetpack_boost_page_optimize_js_load_mode',
		__( 'Non-critical script execution mode (experimental)', jetpack_boost_page_optimize_get_text_domain() ),
		'jetpack_boost_page_optimize_settings_field_js_load_mode',
		'jetpack-boost-page-optimize',
		'jetpack_boost_page_optimize_settings_section'
	);
	add_settings_field(
		'jetpack_boost_page_optimize_css',
		__( 'CSS', jetpack_boost_page_optimize_get_text_domain() ),
		'jetpack_boost_page_optimize_settings_field_css',
		'jetpack-boost-page-optimize',
		'jetpack_boost_page_optimize_settings_section'
	);
}

add_action( 'admin_init', 'jetpack_boost_page_optimize_settings_init' );

function jetpack_boost_page_optimize_add_plugin_settings_link( $plugin_action_links, $plugin_file = null ) {
	if ( ! ( 'page-optimize/page-optimize.php' === $plugin_file && current_user_can( 'manage_options' ) ) ) {
		return $plugin_action_links;
	}

	$settings_link = sprintf(
		'<a href="options-general.php?page=jetpack-boost-page-optimize">%s</a>',
		__( 'Settings', jetpack_boost_page_optimize_get_text_domain() )
	);
	array_unshift( $plugin_action_links, $settings_link );

	return $plugin_action_links;
}

add_filter( 'plugin_action_links', 'jetpack_boost_page_optimize_add_plugin_settings_link', 10, 2 );
