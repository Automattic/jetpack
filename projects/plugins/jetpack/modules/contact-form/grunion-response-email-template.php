<?php
/**
 * Grunion Contact Form Template
 * The template contains several placeholders:
 * %1$s is the hero text to display above the response
 * %2$s is the response itself.
 * %3$s is a link to the respone page in wp-admin
 * %4$s is a link to the embedded form to allow the site owner to edit it to change their email address.
 * %5$s is the footer HTML.
 *
 * @package automattic/jetpack
 */

// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- used in grunion-contact-form.php
$template = '
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<body>
<!-- title -->
%1$s

<!-- response -->
<p>%2$s</p>
%3$s
%4$s
<!-- footer -->
<p>%5$s</p>
</body>
</html>
';
