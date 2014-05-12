<?php

// Edit here to add new services
function jetpack_verification_services() {
	return array(
			'google' => array(
			'name'   =>'Google Webmaster Tools',
			'key'    =>'google-site-verification',
			'format' =>'dBw5CvburAxi537Rp9qi5uG2174Vb6JwHwIRwPSLIK8',
			'url'    => 'https://www.google.com/webmasters/tools/',
		),
		'bing' => array(
			'name'   =>'Bing Webmaster Center',
			'key'    =>'msvalidate.01',
			'format' =>'12C1203B5086AECE94EB3A3D9830B2E',
			'url'    => 'http://www.bing.com/webmaster/',
		 ),
		'pinterest' => array(
			'name'   => 'Pinterest Site Verification',
			'key'    => 'p:domain_verify',
			'format' => 'f100679e6048d45e4a0b0b92dce1efce',
			'url'    => 'https://pinterest.com/website/verify/',
		),
	);
}


function jetpack_verification_options_init() {
	register_setting( 'verification_services_codes_fields', 'verification_services_codes', 'jetpack_verification_validate' );
}
add_action( 'admin_init', 'jetpack_verification_options_init' );

function jetpack_verification_print_meta() {
	$verification_services_codes = get_option( 'verification_services_codes' );
	if ( is_array( $verification_services_codes ) ) {
		$ver_output = "<!-- Jetpack Site Verification Tags -->\n";
		foreach ( jetpack_verification_services() as $name => $service ) {
			if ( is_array( $service ) && !empty( $verification_services_codes["$name"] ) ) {
				$ver_tag = sprintf( '<meta name="%s" content="%s" />', esc_attr( $service["key"] ), esc_attr( $verification_services_codes["$name"] ) );
				$ver_output .= apply_filters( 'jetpack_site_verification_output', $ver_tag );
				$ver_output .= "\n";
			}
		}
	echo $ver_output;
	}
}
add_action( 'wp_head', 'jetpack_verification_print_meta', 1 );

function jetpack_verification_get_code( $code ){
	$pattern = '/content=["\']?([^"\' ]*)["\' ]/is';
	preg_match( $pattern, $code, $match );
	if ( $match ){
		return urldecode( $match[1] );
	} else {
		return false;
	}
}

function jetpack_verification_validate( $verification_services_codes ) {
	foreach ( $verification_services_codes as $key => &$code ) {
		// Parse html meta tags if present
		if ( stripos( $code, 'meta' ) )
			$code = jetpack_verification_get_code( $code );

		$code = esc_attr( trim( $code ) );

		// limit length to 100 chars.
		$code = substr( $code, 0, 100 );

		do_action( 'jetpack_site_verification_validate', $key, $code );
	}
	return $verification_services_codes;
}

function jetpack_verification_options_form() {
	$verification_services_codes = get_option( 'verification_services_codes' );
	?>
<form method="post" action="options.php">
	<?php settings_fields( 'verification_services_codes_fields' ); ?>
	<table class="form-table">
	<?php
	foreach ( jetpack_verification_services() as $key => $service ) {
		echo "<tr valign='top'>
				<th scope='row'>" . esc_html( $service['name'] ) . "</th>
			 	<td>
					<input value='" . esc_attr( $verification_services_codes["$key"] ) . "' size='50' name='verification_services_codes[" . esc_attr( $key ) . "]' type='text' />
				</td>
			</tr><tr>
				<td colspan='2'><small>
					<label for='verification_services_codes[" . esc_attr( $key ) . "]'>" . esc_html( __( 'Example:' , 'jetpack' ) ) . " <code>&lt;meta name='" . esc_attr( $service['key'] ) . "' content='<strong>" . esc_attr( $service['format'] ) . "</strong>'&gt;</code></label>
				</small></td>
			</tr>";
	}
	?>
	</table>
	<p class="submit">
		<input type="submit" class="button-primary" value="<?php _e( 'Save Changes' , 'jetpack' ); ?>" />
	</p>
</form>
<?php
}

function jetpack_verification_tool_box() {
	global $current_user;

	if ( !apply_filters( 'jetpack_enable_site_verification', true ) )
		return;

	$list = array();
	foreach ( jetpack_verification_services() as $key => $service ) {
		$list[] = '<a href="' . esc_url( $service['url'] ) . '">' . esc_html( $service['name'] ) . '</a>';
	}
	$last = array_pop( $list );

	if ( current_user_can( 'manage_options' ) ) {
		echo '<div class="tool-box"><h3 class="title">' . __( 'Website Verification Services' , 'jetpack' ) . ' <a href="http://support.wordpress.com/webmaster-tools/" target="_blank">(?)</a></h3>';
		echo '<p>' . sprintf( esc_html( __( 'Enter your meta key "content" value to verify your blog with %s' , 'jetpack' ) ), implode( ', ', $list ) ) . ' ' . __( 'and' , 'jetpack' ) . ' ' . $last . '.</p>';
		jetpack_verification_options_form();
		echo '</div>';
	}
}
add_action( 'tool_box', 'jetpack_verification_tool_box', 25 );
