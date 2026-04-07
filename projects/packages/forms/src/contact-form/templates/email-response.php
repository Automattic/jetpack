<?php
/**
 * Jetpack Forms Email Response Template
 *
 * The template contains several placeholders:
 * %1$s is the hero text to display above the response (can be empty or filtered)
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

$link_color           = \Automattic\Jetpack\Forms\ContactForm\Feedback_Email_Renderer::LINK_COLOR;
$text_color           = \Automattic\Jetpack\Forms\ContactForm\Feedback_Email_Renderer::TEXT_COLOR;
$text_secondary_color = \Automattic\Jetpack\Forms\ContactForm\Feedback_Email_Renderer::TEXT_SECONDARY_COLOR;
$font_size_metadata   = \Automattic\Jetpack\Forms\ContactForm\Feedback_Email_Renderer::FONT_SIZE_METADATA;
$font_size_button     = \Automattic\Jetpack\Forms\ContactForm\Feedback_Email_Renderer::FONT_SIZE_BUTTON;

// Print-friendly styles: @media print hides decorative icons, tightens spacing,
// and removes non-essential elements. Works for clients that preserve <style> tags
// in print (Apple Mail ~52%, Outlook, Thunderbird). Gmail strips <style> when
// printing so @media print has no effect there — a known limitation.
// Defined as a variable so it can also be injected into <body> for Outlook.com.
$print_style = '@media print {
	body, .body { background-color: #ffffff !important; }
	.container { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
	.wrapper { padding: 16px 0 !important; }
	.main { border-radius: 0 !important; }
	.field-icon-cell { display: none !important; width: 0 !important; max-width: 0 !important; padding: 0 !important; overflow: hidden !important; }
	.form-fields-inner { padding: 0 !important; }
	.actions, .powered-by-table, .preheader { display: none !important; }
	.collapse { display: none !important; }
}';

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
	<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
		<tr>
			<td class="collapse">&nbsp;</td>
			<td class="container">
				<div class="content">
					<span class="preheader">%1$s</span>
					<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main">
						<tr>
							<td class="wrapper">
								<!-- Header title -->
								%1$s

								<!-- Respondent Info -->
								%10$s

								<!-- Metadata -->
								%11$s

								<!-- Form Fields -->
								<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" class="form-fields" style="margin-top: 8px;">
									<tr>
										<td class="form-fields-inner" style="padding: 16px 16px 24px;">
											%2$s
										</td>
									</tr>
								</table>

								%3$s
								%4$s

								<!-- Actions -->
								<div class="actions">
									%8$s
								</div>

								<!-- Powered By -->
								%9$s
							</td>
						</tr>
					</table>
				</div>
			</td>
			<td class="collapse">&nbsp;</td>
		</tr>
	</table>
	%7$s
</body>
</html>
';

// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- used in class-contact-form.php
$style = '<style media="all" type="text/css">
	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		-webkit-font-smoothing: antialiased;
		font-size: 14px;
		line-height: 1.5;
		-ms-text-size-adjust: 100%;
		-webkit-text-size-adjust: 100%;
		color: ' . $text_color . ';
	}

	table {
		border-collapse: separate;
		mso-table-lspace: 0pt;
		mso-table-rspace: 0pt;
		width: 100%;
	}

	table td {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		font-size: 14px;
		vertical-align: top;
	}

	body {
		background-color: #f6f7f7;
		margin: 0;
		padding: 0;
	}

	.body {
		background-color: #f6f7f7;
		width: 100%;
	}

	.container {
		margin: 0 auto !important;
		max-width: 830px;
		padding: 0;
		padding-top: 24px;
		padding-bottom: 24px;
		width: 830px;
	}

	.content {
		box-sizing: border-box;
		display: block;
		margin: 0 auto;
		max-width: 830px;
		padding: 0;
	}

	.main {
		background: #ffffff;
		border-radius: 8px;
		width: 100%;
	}

	.wrapper {
		box-sizing: border-box;
		padding: 40px 48px;
	}

	.preheader {
		color: transparent;
		display: none;
		height: 0;
		max-height: 0;
		max-width: 0;
		opacity: 0;
		overflow: hidden;
		mso-hide: all;
		visibility: hidden;
		width: 0;
	}

	/* Header */
	.email-header {
		font-size: 20px;
		font-weight: 600;
		color: ' . $text_color . ';
		margin: 0 0 24px 0;
		padding: 0;
	}

	.respondent-name {
		font-size: 16px;
		font-weight: 500;
		color: ' . $text_color . ';
		margin: 0 0 2px 0;
	}

	.respondent-email {
		font-size: 14px;
		color: ' . $text_secondary_color . ';
		margin: 0;
		line-height: 1.4;
	}

	.metadata-table {
		width: 100%;
	}

	.metadata-table td {
		padding: 4px 0;
		font-size: ' . $font_size_metadata . ';
		vertical-align: top;
	}

	.metadata-label {
		color: #636363;
		width: 110px;
		padding-right: 12px;
	}

	.metadata-value {
		color: ' . $text_color . ';
	}

	.metadata-value a {
		color: ' . $link_color . ';
		text-decoration: underline;
	}

	/* Form Fields */
	.form-fields {
		margin-top: 8px;
	}

	.form-fields-inner {
		padding: 16px 16px 24px;
	}

	.action-button {
		display: inline-block;
		padding: 12px 24px;
		border-radius: 4px;
		font-size: ' . $font_size_button . ';
		font-weight: 500;
		text-decoration: none;
		margin: 0 6px;
	}

	.action-button-primary {
		background-color: #3858e9;
		color: #ffffff !important;
	}

	.action-button-secondary {
		background-color: transparent;
		color: ' . $link_color . ' !important;
		border: 1px solid ' . $link_color . ';
	}

	.powered-by {
		text-align: center;
		padding: 16px 0;
	}

	h1 {
		font-size: 20px;
		font-weight: 600;
	}

	p {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		font-size: 14px;
		font-weight: normal;
		margin: 0;
		margin-bottom: 16px;
	}

	.respondent-avatar-cell {
		width: 64px;
		vertical-align: middle;
	}

	.respondent-avatar-wrapper {
		width: 48px;
		height: 48px;
		border-radius: 24px;
		background-color: #f0f0f0;
		text-align: center;
		line-height: 48px;
		font-size: 18px;
		font-weight: 600;
		color: #50575e;
	}

	.respondent-details-cell {
		vertical-align: middle;
	}
</style>
<style media="all" type="text/css">
	/* Responsive */
	@media only screen and (max-width: 640px) {
		.main p,
		.main td,
		.main span {
			font-size: 14px !important;
		}

		.wrapper {
			padding: 16px !important;
		}

		.content {
			padding: 0 !important;
		}

		.container {
			padding: 0 !important;
			padding-top: 8px !important;
			padding-bottom: 8px !important;
			width: 100% !important;
		}

		.main {
			border-left-width: 0 !important;
			border-radius: 0 !important;
			border-right-width: 0 !important;
		}

		.collapse {
			display: none;
		}

		h1 {
			padding: 0 16px;
		}

		.powered-by {
			padding: 0 16px 16px !important;
		}

		.form-fields-inner {
			padding: 8px 8px 16px !important;
		}

		.metadata-label {
			width: 90px !important;
		}

		.actions {
			width: 100% !important;
			padding: 0 !important;
		}

		.actions .button-table,
		.actions .button-table tbody,
		.actions .button-table tr,
		.actions .button-cell {
			display: block !important;
			width: 100% !important;
			max-width: 100% !important;
		}

		.button-cell {
			text-align: center !important;
			padding: 4px 0 !important;
		}

		.action-button {
			display: block !important;
			width: 100% !important;
			box-sizing: border-box !important;
			text-align: center !important;
		}
	}

	' . $print_style . '

	@media all {
		.ExternalClass {
			width: 100%;
		}

		.ExternalClass,
		.ExternalClass p,
		.ExternalClass span,
		.ExternalClass font,
		.ExternalClass td,
		.ExternalClass div {
			line-height: 100%;
		}

		.apple-link a {
			color: inherit !important;
			font-family: inherit !important;
			font-size: inherit !important;
			font-weight: inherit !important;
			line-height: inherit !important;
			text-decoration: none !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
			font-size: inherit;
			font-family: inherit;
			font-weight: inherit;
			line-height: inherit;
		}
	}
</style>';
