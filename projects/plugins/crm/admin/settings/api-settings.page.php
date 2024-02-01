<?php
/*
!
 * Admin Page: Settings: API settings
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

global $zbs;

$unconfirmed = false;

if ( isset( $_POST['generate-api-creds'] ) && $_POST['generate-api-creds'] == 1 ) {

	if (
		isset( $_POST['_wpnonce'] ) && wp_verify_nonce( $_POST['_wpnonce'], 'generate-api-creds' )
		&& zeroBSCRM_isZBSAdminOrAdmin()
	) {

		if ( ! isset( $_POST['really_generate'] ) || $_POST['really_generate'] != 1 ) {

			$unconfirmed = true;

		} else {

			$new_api_creds = jpcrm_generate_api_creds();
			zeroBSCRM_html_msg( 0, __( 'Successfully generated new API credentials. Make sure to copy your new keys now, as the secret key will be hidden once you leave this page.', 'zero-bs-crm' ) );

		}
	} else {
		zeroBSCRM_html_msg( 1, __( 'Error generating new API credentials!', 'zero-bs-crm' ) );
	}
}

$api_key    = zeroBSCRM_getAPIKey();
$api_secret = zeroBSCRM_getAPISecret();

$endpoint_url = zeroBSCRM_getAPIEndpoint();

// Warning if permalinks not pretty
if ( ! zeroBSCRM_checkPrettyPermalinks() ) {
	$permalinks_url = admin_url( 'options-permalink.php' );
	echo "<div class='ui error message danger' style='display:block;'><i class='exclamation circle icon white'></i>" . wp_kses( sprintf( __( 'Permalinks need to be pretty for the API to be available. Update your <a href="%s">Permalink settings</a>.', 'zero-bs-crm' ), esc_url( $permalinks_url ) ), $zbs->acceptable_restricted_html ) . '</div>';
}

?>

<style>
	.jpcrm-api-creds-generate{
		padding:20px;
		text-align:center;
		font-size:30px;
		background:white;
	}
	.jpcrm-api-creds-generate .button-primary{
		font-size:20px;
	}
</style>
<?php

if ( $api_key == '' ) {

	?>

	<div class='jpcrm-api-creds-generate'>
		<form method="POST">
			<p><?php esc_html_e( 'You do not have an API key. Generate one?', 'zero-bs-crm' ); ?></p>
			<input type='hidden' name='generate-api-creds' value='1'/>
			<input type='hidden' name='really_generate' value='1'/>
			<?php wp_nonce_field( 'generate-api-creds' ); ?>
			<input type='submit' class='generate-api ui primary button' value='<?php esc_attr_e( 'Generate API key', 'zero-bs-crm' ); ?>'/>
		</form>
	</div>
	<?php
} elseif ( ! $unconfirmed ) {

		echo '<table class="table table-bordered table-striped wtab">';
		echo '<thead><tr>';
		echo '<th colspan=2>' . esc_html__( 'API Settings', 'zero-bs-crm' ) . '</th>';
		echo '</tr></thead>';
		echo '<tbody>';
		echo '<tr><td>' . esc_html__( 'API Endpoint', 'zero-bs-crm' ) . '</td><td>' . esc_html( $endpoint_url ) . '</td></tr>';
		echo '<tr><td>' . esc_html__( 'API Key', 'zero-bs-crm' ) . '</td><td>' . esc_html( $api_key ) . '</td></tr>';
		echo '<tr><td>' . esc_html__( 'API Secret', 'zero-bs-crm' ) . '</td><td>';
	if ( ! empty( $new_api_creds ) ) {
		echo esc_html( $new_api_creds['secret'] );
	} else {
		echo esc_html__( 'Your API secret is not displayed for security reasons. If you no longer have access to your API secret, please generate a new one.', 'zero-bs-crm' );
	}
		echo '</td></tr>';

		##WLREMOVE
	?>
		<tr><td colspan=2><a href="<?php echo esc_url( $zbs->urls['apidocs'] ); ?>" target="_blank" class="ui right floated tiny button"><?php esc_html_e( 'API Docs', 'zero-bs-crm' ); ?></a></td></tr>
		<?php

		##/WLREMOVE

		echo '</tbody>';
		echo '</table>';
		?>
		<div class="jpcrm-api-creds-generate">
			<form method="POST">
				<input type="hidden" name="generate-api-creds" value="1" />
				<?php wp_nonce_field( 'generate-api-creds' ); ?>
				<input type="submit" class="generate-api ui primary button" value="<?php esc_attr_e( 'Regenerate API Credentials', 'zero-bs-crm' ); ?>" />
			</form>
		</div>
		<?php

} else {
	?>
		<div id="clpSubPage" class="whclpActionMsg six">
			<p><strong><?php esc_html_e( 'Regenerate API Credentials', 'zero-bs-crm' ); ?></strong></p>
			<h3><?php esc_html_e( 'Are you sure you want to regenerate your API Credentials?', 'zero-bs-crm' ); ?></h3>
		<?php esc_html_e( 'Regenerating your API Credentials will mean that any API details currently in use will no longer work.', 'zero-bs-crm' ); ?><br /><br />

			<div class="jpcrm-api-creds-generate">
				<form method="POST">
					<input type='hidden' name="generate-api-creds" value="1" />
					<input type='hidden' name="really_generate" value="1" />
				<?php wp_nonce_field( 'generate-api-creds' ); ?>
					<input type="submit" class="generate-api ui primary button" value="<?php esc_attr_e( 'Yes, regenerate API key and secret', 'zero-bs-crm' ); ?>" />
					<button type="button" class="button button-large" onclick="javascript:window.location='?page=<?php echo esc_attr( $zbs->slugs['settings'] ); ?>&tab=api';"><?php esc_html_e( 'No, cancel and do nothing', 'zero-bs-crm' ); ?></button>
				</form>
			</div>
			<br />
		</div>
		<?php

}
