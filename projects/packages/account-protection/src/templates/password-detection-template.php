<?php

$password_detection_css_url = plugin_dir_url( __FILE__ ) . '../css/password-detection.css';

?>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title><?php echo 'Jetpack  - ' . esc_html( $header_title ); ?></title>
		<link rel="stylesheet" type="text/css" href="<?php echo esc_url( $password_detection_css_url ); ?>">
	</head>
	<body>
		<div class="custom">
			<?php require plugin_dir_path( __FILE__ ) . '../assets/jetpack-logo.php'; ?>
			<p class="custom-title"><?php echo esc_html( $page_title ); ?></p>
			<?php echo $content; ?>
		</div>
	</body>
</html>';