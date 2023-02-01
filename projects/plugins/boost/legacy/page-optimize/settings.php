<?php

function page_optimize_settings_page() {
	?>
	<div class="wrap">
		<h1><?php _e( 'Performance Settings', page_optimize_get_text_domain() ); ?></h1>
		<form method="post" action="options.php">
			<?php
			settings_fields( 'performance' );
			do_settings_sections( 'page-optimize' );
			submit_button();
			?>
		</form>
	</div>
	<?php
}

function page_optimize_settings_section() {
	_e(
		'Concatenating JavaScript and CSS for faster site loading and lower number of requests. Scripts are grouped by the original placement.',
		page_optimize_get_text_domain()
	);
	echo '<br />';
	_e(
		'This plugin disables Jetpack "Speed up static file load times".',
		page_optimize_get_text_domain()
	);
}

function page_optimize_settings_field_js( $args ) {
	?>
	<fieldset>
		<label>
			<input type="checkbox" id="page_optimize-js" name="page_optimize-js" value="1" <?php checked( get_option( 'page_optimize-js' ) ); ?>>
			<?php _e( 'Concatenate scripts', page_optimize_get_text_domain() ); ?>
		</label>
		<br>
		<label for="page_optimize-js-exclude">
			<?php _e( 'Comma separated list of strings to exclude from JS concatenating:', page_optimize_get_text_domain() ); ?>
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

function page_optimize_settings_field_js_load_mode( $args ) {
	?>
	<fieldset>
		<label>
			<input type="radio" name="page_optimize-load-mode" value="" <?php checked( '', get_option( 'page_optimize-load-mode' ), true ); ?>>
			<?php _e( 'None', page_optimize_get_text_domain() ); ?>
		</label>
		<label>
			<input type="radio" name="page_optimize-load-mode" value="async" <?php checked( 'async', get_option( 'page_optimize-load-mode' ), true ); ?>>
			<?php _e( 'Async', page_optimize_get_text_domain() ); ?>
		</label>
		<label>
			<input type="radio" name="page_optimize-load-mode" value="defer" <?php checked( 'defer', get_option( 'page_optimize-load-mode' ), true ); ?>>
			<?php _e( 'Defer', page_optimize_get_text_domain() ); ?>
		</label>

		<p class="description">
			<?php _e( 'You can choose the execution mode of the concatenated JavaScript. <strong>This option might break your site, so use carefully.</strong>', page_optimize_get_text_domain() ); ?>
		</p>
	</fieldset>
	<?php
}

function page_optimize_settings_field_css( $args ) {
	?>
	<fieldset>
		<label>
			<input type="checkbox" id="page_optimize-css" name="page_optimize-css" value="1" <?php checked( get_option( 'page_optimize-css' ) ); ?>>
			<?php _e( 'Concatenate styles', page_optimize_get_text_domain() ); ?>
		</label>
		<br>
		<label for="page_optimize-css-exclude">
			<?php _e( 'Comma separated list of strings to exclude from CSS concatenating:', page_optimize_get_text_domain() ); ?>
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

function page_optimize_settings_add_menu() {
	add_options_page(
		__( 'Performance Settings', page_optimize_get_text_domain() ),
		__( 'Performance', page_optimize_get_text_domain() ),
		'manage_options',
		'page-optimize',
		'page_optimize_settings_page'
	);
}

add_action( 'admin_menu', 'page_optimize_settings_add_menu' );

function page_optimize_settings_init() {
	register_setting(
		'performance',
		'page_optimize-js',
		array(
			'description' => __( 'JavaScript concatenation', page_optimize_get_text_domain() ),
			'type' => 'boolean',
			'default' => page_optimize_js_default(),
		)
	);
	register_setting(
		'performance',
		'page_optimize-load-mode',
		array(
			'description' => __( 'Non-critical script execution mode', page_optimize_get_text_domain() ),
			'type' => 'string',
			'default' => page_optimize_js_load_mode_default(),
			'sanitize_callback' => 'page_optimize_sanitize_js_load_mode',
		)
	);
	register_setting(
		'performance',
		'page_optimize-js-exclude',
		array(
			'description' => __( 'Comma separated list of strings to exclude from JS concatenating', page_optimize_get_text_domain() ),
			'type' => 'string',
			'default' => implode( ',', page_optimize_js_exclude_list_default() ),
			'sanitize_callback' => 'page_optimize_sanitize_exclude_field',
		)
	);
	register_setting(
		'performance',
		'page_optimize-css',
		array(
			'description' => __( 'CSS concatenation', page_optimize_get_text_domain() ),
			'type' => 'boolean',
			'default' => page_optimize_css_default(),
		)
	);
	register_setting(
		'performance',
		'page_optimize-css-exclude',
		array(
			'description' => __( 'Comma separated list of strings to exclude from CSS concating', page_optimize_get_text_domain() ),
			'type' => 'string',
			'default' => implode( ',', page_optimize_css_exclude_list_default() ),
			'sanitize_callback' => 'page_optimize_sanitize_exclude_field',
		)
	);

	add_settings_section(
		'page_optimize_settings_section',
		__( 'Page Optimization', page_optimize_get_text_domain() ),
		'page_optimize_settings_section',
		'page-optimize'
	);
	add_settings_field(
		'page_optimize_js',
		__( 'JavaScript', page_optimize_get_text_domain() ),
		'page_optimize_settings_field_js',
		'page-optimize',
		'page_optimize_settings_section'
	);
	add_settings_field(
		'page_optimize_js_load_mode',
		__( 'Non-critical script execution mode (experimental)', page_optimize_get_text_domain() ),
		'page_optimize_settings_field_js_load_mode',
		'page-optimize',
		'page_optimize_settings_section'
	);
	add_settings_field(
		'page_optimize_css',
		__( 'CSS', page_optimize_get_text_domain() ),
		'page_optimize_settings_field_css',
		'page-optimize',
		'page_optimize_settings_section'
	);
}

add_action( 'admin_init', 'page_optimize_settings_init' );

function page_optimize_add_plugin_settings_link( $plugin_action_links, $plugin_file = null ) {
	if ( ! ( 'page-optimize/page-optimize.php' === $plugin_file && current_user_can( 'manage_options' ) ) ) {
		return $plugin_action_links;
	}

	$settings_link = sprintf(
		'<a href="options-general.php?page=page-optimize">%s</a>',
		__( 'Settings', page_optimize_get_text_domain() )
	);
	array_unshift( $plugin_action_links, $settings_link );

	return $plugin_action_links;
}

add_filter( 'plugin_action_links', 'page_optimize_add_plugin_settings_link', 10, 2 );
