<?php
/**
 * Jetpack Forms Email Response Template
 *
 * The template contains several placeholders:
 * %1$s is the hero text to display above the response (e.g., "Hey, a new form response just came in!")
 * %2$s is the response itself (form fields HTML).
 * %3$s was a link to the response page in wp-admin (left empty for backwards compatibility)
 * %4$s was a link to the embedded form to allow the site owner to edit it to change their email address (left empty for backwards compatibility)
 * %5$s is the footer HTML (metadata: time, IP, browser, source URL).
 * %6$s style HTML tag.
 * %7$s tracking pixel
 * %8$s is the actions HTML (buttons).
 * %9$s is powered by email logo.
 * %10$s is the respondent info section (avatar, name, email).
 * %11$s is the metadata section (Date, Source, Device, IP).
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- used in class-contact-form.php
$template = '
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	%6$s
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.5; -ms-text-size-adjust: 100%%; -webkit-text-size-adjust: 100%%; color: #1e1e1e; background-color: #f6f7f7; margin: 0; padding: 0;">
	<!--[if mso]>
	<style type="text/css">
		body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
	</style>
	<![endif]-->
	<span style="display: none; font-size: 1px; color: #f6f7f7; line-height: 1px; mso-hide: all;">%1$s</span>
	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f7f7;">
		<tr>
			<td style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
			<td style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; font-size: 14px; vertical-align: top; width: 830px; max-width: 830px; padding: 24px 0 0 0;" width="830">
				<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 8px;">
					<tr>
						<td style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; font-size: 14px; vertical-align: top; padding: 40px 48px;">
							<!-- Respondent Info -->
							%10$s

							<!-- Metadata -->
							%11$s

							<!-- Form Fields -->
							%2$s

							%3$s
							%4$s

							<!-- Footer (legacy metadata) -->
							%5$s

							<!-- Actions -->
							<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin-top: 24px;">
								<tr>
									<td align="center" style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; font-size: 14px; vertical-align: top;">
										%8$s
									</td>
								</tr>
							</table>

							<!-- Powered By -->
							%9$s
						</td>
					</tr>
				</table>
			</td>
			<td style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen-Sans, Ubuntu, Cantarell, \'Helvetica Neue\', sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
		</tr>
	</table>
	%7$s
</body>
</html>
';

// Minimal CSS for email client fixes only - all styling is inline for maximum compatibility.
// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- used in class-contact-form.php
$style = '<style media="all" type="text/css">
	/* Email client fixes for Outlook.com and Gmail */
	.ExternalClass {width: 100%;}
	.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
	/* iOS link color fix */
	a[x-apple-data-detectors] {color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;}
	/* Gmail link color fix */
	u + #body a {color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit;}
	/* Samsung Mail link color fix */
	#MessageViewBody a {color: inherit; text-decoration: none; font-size: inherit; font-family: inherit; font-weight: inherit; line-height: inherit;}
</style>';
