<?php
/**
 * Template for displaying the Jetpack Password Detection page.
 *
 * @package Jetpack
 */

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\Account_Protection\Password_Reset_Email;

$masked_email = Password_Reset_Email::mask_email_address( $email );

?>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title><?php echo 'Jetpack  - ' . $reset ? 'Stay Secure' : 'Secure Your Account'; ?></title>
		<?php wp_head(); ?>
	</head>
	<body class="password-detection-wrapper">
		<div class="password-detection">
			<?php require plugin_dir_path( __FILE__ ) . '../assets/jetpack-logo.svg'; ?>
			<p class="password-detection-title"><?php echo $reset ? 'Take action to stay secure' : "Let's secure your account"; ?></p>
			<?php if ( $reset ) : ?>
				<p><?php echo esc_html( $context ); ?></p>
					<?php if ( $error ) : ?>
						<?php if ( 'proceed_nonce_verification_error' === $error ) : ?>
							<p>We've encountered an issue verifying your request to proceed without updating your password.</p>
						<?php else : ?>
							<p><?php echo 'reset_passowrd_nonce_verification_error' === $error ? "We've encountered an issue verifying your request to create a new password. " : ''; ?>While attempting to send a verification email to <?php echo esc_html( $masked_email ); ?>, an error occurred.</p>
						<?php endif; ?>
					<?php else : ?>
						<p>Don't worry - To keep your account safe, we've sent a verification email to <?php echo esc_html( $masked_email ); ?>. After that, we'll guide you through updating your password.</p>
					<?php endif; ?>
					<?php if ( 'proceed_nonce_verification_error' === $error ) : ?>
						<p>Click <a href="/wp-admin">here</a> to be redirected to your admin dashboard.</p>
					<?php else : ?>
						<p>Please check your inbox and click the link to verify it's you. Alternatively, you can update your password from your <a href="/wp-admin/profile.php#password">account profile</a>.</p>
						<p><span id="resend-password-reset-message">Didn't get the email? </span><a href="#" id="resend-password-reset">Resend email</a></p>
					<?php endif; ?>
			<?php else : ?>
				<p><?php echo esc_html( $context ); ?></p>
				<p>It is highly recommended that you update your password.</p>
				<div class="actions">
					<form method="post">
						<?php wp_nonce_field( 'reset_password_action', '_wpnonce_reset_password' ); ?>
						<button class="action action-reset" type="submit" name="reset-password">Create a new password</button>
					</form>
					<form method="post">
						<?php wp_nonce_field( 'proceed_action', '_wpnonce_proceed' ); ?>
						<button class="action action-proceed" type="submit" name="proceed">Procceed without updating</button>
					</form>
				</div>
				<p>Learn more about the <a href="#">risks of using weak passwords</a> and how to protect your account.</p>
			<?php endif; ?>
		</div>
		<?php wp_footer(); ?>
	</body>
</html>
