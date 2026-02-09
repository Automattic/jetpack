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
								<!-- Header -->
								<h1 class="email-header">%1$s</h1>

								<!-- Respondent Info -->
								%10$s

								<!-- Metadata -->
								%11$s

								<!-- Form Fields -->
								<div class="form-fields">
									%2$s
								</div>

								%3$s
								%4$s

								<!-- Actions -->
								<div class="actions">
									%8$s
								</div>
							</td>
						</tr>
					</table>

					<!-- START FOOTER -->
					<div class="footer">
						<table role="presentation" border="0" cellpadding="0" cellspacing="0">
							<tr>
								<td class="content-block wrapper footer-content">
									<!-- footer -->
									<p>%5$s</p>
								</td>
							</tr>
							%9$s
						</table>
					</div>
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
		color: #1e1e1e;
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
		max-width: 600px;
		padding: 0;
		padding-top: 24px;
		width: 600px;
	}

	.content {
		box-sizing: border-box;
		display: block;
		margin: 0 auto;
		max-width: 600px;
		padding: 0;
	}

	.main {
		background: #ffffff;
		border-radius: 8px;
		width: 100%;
	}

	.wrapper {
		box-sizing: border-box;
		padding: 32px;
	}

	.content-block {
		box-sizing: border-box;
		padding: 0 32px 24px;
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
		color: #1e1e1e;
		margin: 0 0 24px 0;
		padding: 0;
	}

	/* Respondent Info Section */
	.respondent-info {
		display: flex;
		align-items: center;
		margin-bottom: 24px;
		padding-bottom: 20px;
		border-bottom: 1px solid #e0e0e0;
	}

	.respondent-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background-color: #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		font-weight: 600;
		color: #50575e;
		margin-right: 16px;
		flex-shrink: 0;
	}

	.respondent-avatar img {
		width: 48px;
		height: 48px;
		border-radius: 50%;
	}

	.respondent-details {
		flex: 1;
	}

	.respondent-name {
		font-size: 16px;
		font-weight: 600;
		color: #1e1e1e;
		margin: 0 0 2px 0;
	}

	.respondent-email {
		font-size: 14px;
		color: #50575e;
		margin: 0;
	}

	/* Metadata Section */
	.metadata-section {
		background-color: #f6f7f7;
		border-radius: 4px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.metadata-table {
		width: 100%;
	}

	.metadata-table td {
		padding: 4px 0;
		font-size: 13px;
		vertical-align: top;
	}

	.metadata-label {
		color: #50575e;
		width: 100px;
		padding-right: 12px;
	}

	.metadata-value {
		color: #1e1e1e;
	}

	.metadata-value a {
		color: #3858e9;
		text-decoration: none;
	}

	/* Form Fields */
	.form-fields {
		margin-top: 8px;
	}

	.form-field {
		padding: 16px 0;
		border-bottom: 1px solid #e0e0e0;
	}

	.form-field:last-child {
		border-bottom: none;
	}

	.field-row {
		display: flex;
		align-items: flex-start;
	}

	.field-icon {
		width: 20px;
		height: 20px;
		margin-right: 12px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.field-icon svg {
		width: 20px;
		height: 20px;
		fill: #50575e;
	}

	.field-content {
		flex: 1;
		min-width: 0;
	}

	.field-label {
		font-size: 12px;
		color: #50575e;
		margin: 0 0 4px 0;
		text-transform: none;
	}

	.field-value {
		font-size: 14px;
		color: #1e1e1e;
		margin: 0;
		word-wrap: break-word;
	}

	.field-value a {
		color: #3858e9;
		text-decoration: underline;
	}

	/* Tag/Chip Styles for Multi-select */
	.field-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 4px;
	}

	.field-tag {
		display: inline-block;
		background-color: #f0f0f0;
		border-radius: 12px;
		padding: 4px 12px;
		font-size: 13px;
		color: #1e1e1e;
	}

	/* Image Select Styles */
	.image-choices {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 8px;
	}

	.image-choice {
		text-align: center;
	}

	.image-choice img {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 4px;
		border: 1px solid #e0e0e0;
	}

	.image-choice-label {
		font-size: 12px;
		color: #50575e;
		margin-top: 4px;
	}

	/* Rating Styles */
	.rating-stars {
		color: #f5c518;
		font-size: 18px;
		letter-spacing: 2px;
	}

	/* File Upload Styles */
	.file-item {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.file-icon {
		width: 16px;
		height: 16px;
		fill: #50575e;
	}

	.file-name {
		color: #3858e9;
		text-decoration: underline;
	}

	.file-size {
		color: #50575e;
		font-size: 12px;
	}

	/* Consent Chip */
	.consent-chip {
		display: inline-block;
		background-color: #d4edda;
		color: #155724;
		border-radius: 12px;
		padding: 4px 12px;
		font-size: 13px;
	}

	.consent-chip.no {
		background-color: #f8d7da;
		color: #721c24;
	}

	/* Actions Section */
	.actions {
		margin-top: 24px;
		text-align: center;
	}

	.actions-table {
		width: 100%;
	}

	.action-button {
		display: inline-block;
		padding: 12px 24px;
		border-radius: 4px;
		font-size: 14px;
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
		color: #1e1e1e !important;
		border: 1px solid #1e1e1e;
	}

	/* Legacy Actions Support */
	.actions .button_block {
		mso-table-lspace: 0pt;
		mso-table-rspace: 0pt;
		width: unset;
		margin-top: 24px;
	}

	.actions .button_block .pad,
	.actions .button_block .pad a {
		border-radius: 4px;
		background-image: url(\'https://s0.wordpress.com/i/emails/marketing/wpcom/2024/blueberry-px.png\');
		background-size: cover;
		background-color: #3858E9;
	}

	.actions .button_block .pad a {
		font-size: 14px;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		font-weight: 500;
		text-decoration: none;
		padding: 12px 24px;
		color: #ffffff;
		border-radius: 4px;
		display: inline-block;
		mso-padding-alt: 0;
	}

	.actions .button_block .pad a span {
		mso-text-raise: 15pt;
	}

	.actions .button_block .pad i {
		letter-spacing: 25px;
		mso-font-width: -100%;
	}

	/* Footer */
	.footer {
		clear: both;
		padding: 24px 0;
		width: 100%;
	}

	.footer-content {
		text-align: center;
	}

	.footer td,
	.footer p,
	.footer span,
	.footer a {
		color: #50575e;
		font-size: 12px;
	}

	.powered-by {
		text-align: center;
		padding: 16px 0;
	}

	.powered-by a {
		color: #50575e;
		text-decoration: none;
		font-size: 12px;
	}

	.powered-by img {
		vertical-align: middle;
		margin-right: 4px;
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
		vertical-align: top;
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

		.metadata-label {
			width: 80px !important;
		}

		.action-button {
			display: block !important;
			margin: 8px 0 !important;
		}
	}

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
