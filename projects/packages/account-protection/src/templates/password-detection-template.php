<?php
/**
 * Template for displaying the Jetpack Password Detection page.
 *
 * @package Jetpack
 */

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\Account_Protection\Password_Reset_Email;

$reset   = isset( $reset ) ? $reset : false;
$context = isset( $context ) ? $context : 'Your current password was found in a public leak, which means your account might be at risk.';
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
			<?php require plugin_dir_path( __FILE__ ) . '../assets/jetpack-logo.php'; ?>
			<p class="password-detection-title"><?php echo $reset ? 'Take action to stay secure' : "Let's secure your account"; ?></p>
			<?php if ( $reset ) : ?>
				<p><?php echo esc_html( $context ); ?></p>
				<p>Don't worry - To keep your account safe, we've sent a verification email to a <?php echo esc_html( Password_Reset_Email::mask_email_address( wp_get_current_user()->user_email ) ); ?>. After that, we'll guide you through updating your password.</p>
				<p>Please check your inbox and click the link to verify it's you.</p>
				<p><span id="resend-password-reset-message">Didn't get the email? </span><a href="#" id="resend-password-reset">Resend email</a></p>
			<?php else : ?>
				<p><?php echo esc_html( $context ); ?></p>
				<p>It is highly recommended that you update your password.</p>
				<div class="actions">
					<form method="post">
						<button class="action action-reset" type="submit" name="reset">Create a new password</button>
					</form>
					<form method="post">
						<button class="action action-proceed" type="submit" name="proceed">Procceed without updating</button>
					</form>
				</div>
				<p>Learn more about the <a href="#">risks of using weak passwords</a> and how to protect your account.</p>
			<?php endif; ?>
		</div>
		<?php wp_footer(); ?>
	</body>
</html>
