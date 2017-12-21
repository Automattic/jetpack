<?php

// Edit here to add new services
function jetpack_verification_services() {
	return array(
			'google' => array(
			'name'   =>'Google Search Console',
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
		'yandex'     => array(
			'name'   => 'Yandex.Webmaster',
			'key'    => 'yandex-verification',
			'format' => '44d68e1216009f40',
			'url'    => 'https://webmaster.yandex.com/sites/',
		),
	);
}


function jetpack_verification_options_init() {
	register_setting( 'verification_services_codes_fields', 'verification_services_codes', 'jetpack_verification_validate' );
}
add_action( 'admin_init', 'jetpack_verification_options_init' );

function jetpack_verification_print_meta() {
	$verification_services_codes =  Jetpack_Options::get_option_and_ensure_autoload( 'verification_services_codes', '0' );
	if ( is_array( $verification_services_codes ) ) {
		$ver_output = "<!-- Jetpack Site Verification Tags -->\n";
		foreach ( jetpack_verification_services() as $name => $service ) {
			if ( is_array( $service ) && !empty( $verification_services_codes["$name"] ) ) {
				if ( preg_match( '#^<meta name="([a-z0-9_\-.:]+)?" content="([a-z0-9_-]+)?" />$#i', $verification_services_codes["$name"], $matches ) ) {
					$verification_code = $matches[2];
				} else {
					$verification_code = $verification_services_codes["$name"];
				}
				$ver_tag = sprintf( '<meta name="%s" content="%s" />', esc_attr( $service["key"] ), esc_attr( $verification_code ) );
				/**
				 * Filter the meta tag template used for all verification tools.
				 *
				 * @module verification-tools
				 *
				 * @since 3.0.0
				 *
				 * @param string $ver_tag Verification Tool meta tag.
				 */
				$ver_output .= apply_filters( 'jetpack_site_verification_output', $ver_tag );
				$ver_output .= "\n";
			}
		}
	echo $ver_output;
	}
}
add_action( 'wp_head', 'jetpack_verification_print_meta', 1 );

function jetpack_verification_options_form() {
	$verification_services_codes = get_option( 'verification_services_codes' );
	?>
<form method="post" action="options.php">
	<?php settings_fields( 'verification_services_codes_fields' ); ?>
	<div class="tools-container">
	<?php
	foreach ( jetpack_verification_services() as $key => $service ) {
		echo "<div class='jp-verification-service'>
				<h4>" . esc_html( $service['name'] ) . "</h4>
					<input value='" . esc_attr( isset( $verification_services_codes[ $key ] ) ? $verification_services_codes[ $key ] : '' ) . "' name='verification_services_codes[" . esc_attr( $key ) . "]' type='text' />
				<small>
					<label for='verification_services_codes[" . esc_attr( $key ) . "]'>" . esc_html( __( 'Example:' , 'jetpack' ) ) . " <span>&lt;meta name='" . esc_attr( $service['key'] ) . "' content='<strong>" . esc_attr( $service['format'] ) . "</strong>'&gt;</span></label>
				</small>
			</div>";
	}
	?>
	</div>
	<p class="submit">
		<input type="submit" class="button-primary" value="<?php _e( 'Save Changes' , 'jetpack' ); ?>" />
	</p>
</form>

<style>
/*  Jetpack styles aren't loaded in the tools section of the admin, let's save on some http requests and just do an inline block */

	.jp-verification-tools h3 a {
		text-decoration: none;
	}

	.jp-verification-service {
		border-bottom: 1px #f1f1f1 solid;
		padding-bottom: 20px;
	}

	.jp-verification-service input[type="text"] {
		width: 100%;
		margin-bottom: 10px;
	}

	.jp-verification-service label {
		font-size: 13px;
	}

	/* mimic 'code' tag style, but this allows for better visuals + line breaks on mobile devices */
	.jp-verification-service span {
		display: block;
		margin-top: 5px;
		font-size: 14px;
		padding: 10px;
		background: #f1f1f1;
		font-family: monospace;
		word-wrap: break-word;
	}

	.jp-verification-service strong {
		font-weight: bold;
	}
</style>

<?php
}

function jetpack_verification_tool_box() {
	global $current_user;

	/**
	 * Decide whether Site Verification tools be added to the Tools menu.
	 *
	 * @module verification-tools
	 *
	 * @since 3.0.0
	 *
	 * @param bool true Should the Site Verification tools be added to the Tools menu.
	 */
	if ( ! apply_filters( 'jetpack_enable_site_verification', true ) )
		return;

	$list = array();
	foreach ( jetpack_verification_services() as $key => $service ) {
		$list[] = '<a href="' . esc_url( $service['url'] ) . '">' . esc_html( $service['name'] ) . '</a>';
	}
	$last = array_pop( $list );

	if ( current_user_can( 'manage_options' ) ) {
		echo '<div class="jp-verification-tools card"><h3 class="title">' . __( 'Website Verification Services' , 'jetpack' ) . ' <a href="http://support.wordpress.com/webmaster-tools/" rel="noopener noreferrer" target="_blank">(?)</a></h3>';
		echo '<p>' . sprintf( esc_html( __( 'Enter your meta key "content" value to verify your blog with %s' , 'jetpack' ) ), implode( ', ', $list ) ) . ' ' . __( 'and' , 'jetpack' ) . ' ' . $last . '.</p>';
		jetpack_verification_options_form();
		echo '</div>';
	}
}
add_action( 'tool_box', 'jetpack_verification_tool_box', 25 );
