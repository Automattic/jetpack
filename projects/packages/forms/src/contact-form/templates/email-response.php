<?php
/**
 * Grunion Contact Form Template
 * The template contains several placeholders:
 * %1$s is the hero text to display above the response
 * %2$s is the response itself.
 * %3$s is a link to the response page in wp-admin
 * %4$s is a link to the embedded form to allow the site owner to edit it to change their email address.
 * %5$s is the footer HTML.
 *
 * @package automattic/jetpack
 */

// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- used in class-contact-form.php
$template = '
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  %6$s
</head>
<body>
  <div class="container">
    <div class="header">
		%1$s
    </div>
    <div class="content">
	<!-- response -->
		<p>%2$s</p>
		%3$s
		%4$s
    </div>
  </div>
  <div class="container container-meta">
		<div class="meta">
			<!-- footer -->
			<p>%5$s</p>
		</div>
		<p class="meta">' . __( 'Powered by Jetpack Forms', 'jetpack-forms' ) . '</p>
    </div>
</body>
</html>
';

// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- used in class-contact-form.php
$style = '<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f7f7f7;
  margin: 0;
  padding: 0;
}
.container {
  max-width: 640px;
  margin: 40px auto 0;
  background-color: #FFF;
  overflow: hidden;
}
.container-meta {
	margin-top: 0;
	background-color: #f7f7f7;
}
hr { display: none; }
.header {
  padding: 24px;
  border-bottom: 1px solid #eee;
}
.header h1 {
  margin: 0 0 10px;
  font-size: 24px;
}
.meta {
  color: #888;
  font-size: 14px;
  padding: 0 24px;
}
.content {
  padding: 24px;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}
</style>';
