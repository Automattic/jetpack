<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Support Contact Page file: This is Support Contact Page file.
 *
 * @package Jetpack CRM
 *
 * Jetpack CRM - https://jetpackcrm.com
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

if ( ! zeroBSCRM_isZBSAdminOrAdmin() ) {
	return;
}

	global $zbs;

	$license          = zeroBSCRM_getSetting( 'license_key' );
	$has_license      = is_array( $license ) && ! empty( $license['key'] );
	$is_valid_license = false;

if ( $has_license ) {

	$is_valid_license = isset( $license['validity'] ) && $license['validity'];

	$license_key = $license['key'];

	// --- Site data ---//

	$site_url = home_url();

	$system_check_list = array(
		'corever'      => 'JPCRM Version',
		'dbver'        => 'Database Version',
		'wordpressver' => 'WordPress Version',
		'phpver'       => 'PHP Version',
	);

	$site_data = array();

	foreach ( $system_check_list as $key => $name ) {
		$result             = zeroBSCRM_checkSystemFeat( $key );
		$site_data[ $name ] = ( $result === true ? 'yes' : $result );
	}

	// --- Migration data ---//

    // PHPCS:Ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	global $zeroBSCRM_migrations;

	// PHPCS:Ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$migrations = $zeroBSCRM_migrations;

	if ( is_array( $migrations ) && count( $migrations ) > 0 ) {
		$site_data['Migrations'] = count( $migrations ) . ' executed';

		if ( zeroBSCRM_getSetting( 'migration300_timeout_issues' ) ) {
			$site_data['Migrations'] .= ' | had timeouts';
		}

		$last_migration = '-';

		foreach ( $migrations as $migration_key ) {

			$migration      = jpcrm_migrations_get_migration( $migration_key )[1];
			$last_migration = $migration_key;

			if ( $migration['completed'] === false ) {
				$site_data['Migrations'] .= " | $migration_key !!!";
			}
		}
		$site_data['Migrations'] .= " | last migration: $last_migration";

	} else {
		$site_data['Migrations'] .= 'no migrations !!!';
	}

	// --- Server data ---//

	$server_env_list = array(
		// Server data
		'permalinks'           => 'Pretty Permalinks',
		'fontinstalled'        => 'Fonts installed',
		'curl'                 => 'cURL',
		'zlib'                 => 'zlib (Zip Library)',
		'mb_internal_encoding' => 'Multibyte String (mbstring PHP module)',
		'dompdf'               => 'PDF Engine',
		'pdffonts'             => 'PDF Font Set',
		'phpver'               => 'PHP Version',
		'memorylimit'          => 'Memory Limit',
		'executiontime'        => 'Max Execution Time',
		'postmaxsize'          => 'Max File POST',
		'uploadmaxfilesize'    => 'Max File Upload Size',
		'wpuploadmaxfilesize'  => 'WordPress Max File Upload Size',
		'encryptionmethod'     => 'Encryption Method',
	);

	$site_data['Server Info'] = array();
	foreach ( $server_env_list as $env_key => $env_name ) {
		$result = zeroBSCRM_checkSystemFeat( $env_key );

		if ( $result === true ) {
			$result = 'yes';
		} elseif ( is_array( $result ) ) {
			$result = wp_json_encode( $result );
		}

		$site_data['Server Info'][] = "$env_name: $result";
	}

	// --- Extensions info ---//

	$extensions_list = zeroBSCRM_installedProExt();

	$site_data['Extensions'] = array();
	foreach ( $extensions_list as $extension ) {
		$extension                 = str_replace( 'Jetpack CRM Extension: ', '', $extension );
		$site_data['Extensions'][] = $extension['name'] . ' ' . $extension['ver'] . ' [' . ( $extension['active'] ? 'on' : 'off' ) . ']';
	}
}
?>

<div id="support-page" class="ui segment container">
	<h1> <i class="icon user md"></i> <?php echo esc_html__( 'Jetpack CRM Support', 'zero-bs-crm' ); ?></h1>
	<hr>
	<div class="license-status">
		<b><?php echo esc_html__( 'License', 'zero-bs-crm' ); ?>:</b>

		<?php if ( ! $has_license ) : ?>
			<span class="label label-default"><?php echo esc_html__( 'NO LICENSE', 'zero-bs-crm' ); ?></span>
			<span class="invalid-license"> <?php echo esc_html__( 'The premium support is only available to customers with a valid license.', 'zero-bs-crm' ); ?> </span>
			<span class="invalid-license">
				<?php // translators: %s: URL to pricing page. ?>
				<b><?php echo wp_kses_post( sprintf( __( '<a href="%s" target="_blank">Check our plans here</a>', 'zero-bs-crm' ), esc_url( $zbs->urls['pricing'] ) . '?utm_source=user_site&utm_medium=support_page' ) ); ?></b>
			</span>
		<?php elseif ( $is_valid_license ) : ?>
			<span class="label label-success"><?php echo esc_html__( 'VALID', 'zero-bs-crm' ); ?></span>
			<span class="license"> <?php echo esc_html( $license_key ); ?> </span>
			<span class="expires">
				<?php echo esc_html__( 'Expires', 'zero-bs-crm' ); ?>:
				<?php echo ( isset( $license['expires'] ) ? esc_html( gmdate( 'Y-m-d H:i', $license['expires'] ) ) : '-' ); ?>
			</span>
			<span class="account">
				<?php // translators: %s: URL to account page. ?>
				<?php echo wp_kses_post( sprintf( __( '<a href="%s" target="_blank">Go to your Jetpack CRM account</a>', 'zero-bs-crm' ), esc_url( $zbs->urls['account'] ) ) ); ?>
			</span>
		<?php else : ?>
			<span class="label label-danger"><?php echo esc_html__( 'NOT VALID', 'zero-bs-crm' ); ?></span> 
			<span class="invalid-license">
				<?php echo esc_html__( 'Your license key is either invalid, expired, or not assigned to this site.', 'zero-bs-crm' ); ?>
				<?php // translators: %s: URL to license keys page. ?>
				<?php echo wp_kses_post( sprintf( __( 'Please visit <a href="%s" target="_blank">your account</a> to verify.', 'zero-bs-crm' ), esc_url( $zbs->urls['licensekeys'] ) ) ); ?>
			</span>
		<?php endif; ?>
	</div>
	
	<?php if ( $is_valid_license ) : ?>
		<h2><?php echo esc_html__( 'Do you need help?', 'zero-bs-crm' ); ?></h2>
		<div class="jetpack-crm-contact-text">
			<p>
				<b><?php echo esc_html__( 'We would love to hear from you!', 'zero-bs-crm' ); ?></b>
				<?php echo esc_html__( 'Our friendly and knowledgeable support staff are here to help you with any questions or issues you may have with Jetpack CRM.', 'zero-bs-crm' ); ?>
				<?php echo esc_html__( 'We strive to provide prompt and efficient support to ensure your satisfaction with our product.', 'zero-bs-crm' ); ?>
			</p>
		</div>
	<?php endif; ?>

	<h2><?php echo esc_html__( 'Check our Knowledge Base', 'zero-bs-crm' ); ?></h2>
	<div class="jetpack-crm-contact-text">
		<?php echo esc_html__( "We want to make sure you get the help you need as quickly as possible. Before filing a support ticket, why not check out our Jetpack CRM Knowledge Base? It's packed with helpful articles and resources to help you get the most out of Jetpack CRM.", 'zero-bs-crm' ); ?>
		<?php // translators: %s URL to knowledge base. ?>
		<?php echo wp_kses( sprintf( __( 'You can access it anytime at <a href="%s" target="_blank"><b>kb.jetpackcrm.com</b></a>.', 'zero-bs-crm' ), esc_url( $zbs->urls['kb'] ) ), $zbs->acceptable_html ); ?>
		<div class="text-center goto-kb">
			<a href="<?php echo esc_url( $zbs->urls['kb'] ); ?>" target="_blank">
				<div class="btn btn-info">
					<i class="icon info circle"></i> 
					<?php echo esc_html__( 'Knowledge Base', 'zero-bs-crm' ); ?>
				</div>
			</a>
		</div> 
	</div>

	<?php if ( $is_valid_license ) : ?>
		<div class="jetpack-crm-contact-text mt-10">
			<p>
				<?php echo esc_html__( "If you can't find what you're looking for, then feel free to reach out to our friendly support team using the form below.", 'zero-bs-crm' ); ?>
			</p>
		</div>
		<h2><?php echo esc_html__( 'Submit a support ticket', 'zero-bs-crm' ); ?></h2>
		<div class="jetpack-crm-contact-text">
			<?php echo esc_html__( 'At Jetpack CRM we have a team of happiness engineers around the world 🌎 who can help answer your questions.', 'zero-bs-crm' ); ?>
		</div>
		<form id="support-form">
			<input type="hidden" name="license" value="<?php echo esc_attr( $license_key ); ?>">
			<input type="hidden" name="site_url" value="<?php echo esc_attr( $site_url ); ?>">
			<input type="hidden" name="site_data" value='<?php echo wp_json_encode( $site_data ); ?>'>
			<div class="form-group">
				<label for="subject"><?php echo esc_html__( 'Subject', 'zero-bs-crm' ); ?>:</label>
				<input type="text" class="form-control" id="subject" name="subject">
			</div>
			<div class="form-group">
				<label for="message"><?php echo esc_html__( 'Message', 'zero-bs-crm' ); ?>:</label>
				<textarea class="form-control" id="message" name="message"></textarea>
			</div>
			<div class=" mb-10">
				<b>This form will send the following technical information to our support team:</b>
			</div>
			<div class="data-shared">
				<b>Site URL:</b> <?php echo esc_html( $site_url ); ?><br>
				<b>License:</b> <?php echo esc_html( $license_key ); ?><br>
				<b>Site data:</b><?php echo wp_json_encode( $site_data ); ?><br>
			</div>
			<div class="text-center">
				<button type="submit" class="btn btn-primary"><?php echo esc_html__( 'Submit', 'zero-bs-crm' ); ?></button>
			</div>
		</form>
		<!-- Result block -->
		<div id="result"></div>
	<?php else : ?>
		<div class="jetpack-crm-contact-text">
			<h2>
				<?php echo esc_html__( 'Support Forum', 'zero-bs-crm' ); ?>
			</h2>
			<p>
				<?php echo esc_html__( "If you can't find what you're looking for, then feel free to ask it in our support forum. We have a great community of Jetpack CRM users, including our happiness engineers who can help answer your questions.", 'zero-bs-crm' ); ?>
			</p>
			<div class="text-center btn-support-forum">
				<a href="<?php echo esc_url( $zbs->urls['support-forum'] ); ?>" target="_blank">
					<div class="btn btn-info">
						<i class="fa fa-comments"></i> <?php echo esc_html__( 'Support Forum', 'zero-bs-crm' ); ?>
					</div>
				</a>
			</div>
		</div>
	<?php endif; ?>
</div>

<?php if ( $is_valid_license ) : ?>
	<script>

		const form = document.getElementById( "support-form" );
		const result = document.getElementById( "result" );
		const subjectInput = document.getElementById( "subject" );
		const messageInput = document.getElementById( "message" );
		const jpcrm_api_endpoint = '<?php echo esc_url( $zbs->urls['api-support'] ); ?>/request';

		form.addEventListener( "submit", async ( event ) => {
			event.preventDefault();

			const formData = new FormData( form );
			const requestOptions = {
				method: "POST",
				body: formData,
			};

			try {
				const response = await fetch( jpcrm_api_endpoint, requestOptions );
				const { success, error, email } = await response.json();

				if ( success ) {
					subjectInput.value = "";
					messageInput.value = "";

					result.innerHTML = `
			<div class="alert alert-success" role="alert">
				<b><?php echo esc_html__( 'Form submitted successfully!', 'zero-bs-crm' ); ?></b> <?php echo esc_html__( 'You will receive an email (${email}) from our support service shortly.', 'zero-bs-crm' ); ?>
			</div>
			`;
				} else {
					result.innerHTML = `
			<div class="alert alert-danger" role="alert">
				<b>Error!</b> ${error}
			</div>
			`;
				}
			} catch ( error ) {
				result.innerHTML = `
			<div class="alert alert-danger" role="alert">
			Error: ${error}
			</div>
		`;
			}
		});
	</script>
	<?php
endif;
