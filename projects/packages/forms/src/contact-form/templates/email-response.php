<?php
/**
 * Grunion Contact Form Template
 * The template contains several placeholders:
 * %1$s is the hero text to display above the response
 * %2$s is the response itself.
 * %3$s was a link to the response page in wp-admin (left empty for backwards compatibility)
 * %4$s was a link to the embedded form to allow the site owner to edit it to change their email address (left empty for backwards compatibility)
 * %5$s is the footer HTML.
 * %6$s style HTML tag.
 * %7$s tracking pixel
 * %8$s is the actions HTML.
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
	<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
		<tr>
			<td class="collapse">&nbsp;</td>
			<td class="container">
				<div class="content">
					<span class="preheader">%1$s</span>
					<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main">
						<tr>
						<td class="wrapper">
							<!-- response -->
							<p>%2$s</p>
							%3$s
							%4$s
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
							<td class="content-block wrapper">
								<!-- footer -->
								<p>%5$s</p>
							</td>
						</tr>
						<tr>
							<td class="content-block powered-by">
								' .
								sprintf(
									// translators: %1$s is a link to the Jetpack Forms page.
									__( 'Powered by %1$s', 'jetpack-forms' ),
									'<a href="https://jetpack.com/forms/?utm_source=jetpack-forms&utm_medium=email&utm_campaign=form-submissions">Jetpack Forms</a>'
								) . '
							</td>
						</tr>
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
		font-family: sans-serif;
		-webkit-font-smoothing: antialiased;
		font-size: 16px;
		line-height: 1.3;
		-ms-text-size-adjust: 100%;
		-webkit-text-size-adjust: 100%;
	}

	table {
		border-collapse: separate;
		mso-table-lspace: 0pt;
		mso-table-rspace: 0pt;
		width: 100%;
	}

	table td {
		font-family: Helvetica, sans-serif;
		font-size: 16px;
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
		max-width: 640px;
		padding: 0;
		padding-top: 24px;
		width: 640px;
	}

	.content {
		box-sizing: border-box;
		display: block;
		margin: 0 auto;
		max-width: 640px;
		padding: 0;
	}

	.main {
		background: #fff;
		width: 100%;
	}

	.wrapper {
		box-sizing: border-box;
		padding: 24px;
	}

	.content-block {
		box-sizing: border-box;
		padding: 0 24px 24px;
	}

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
		font-size: 16px;
		font-family: Inter, Helvetica, Arial, sans-serif;
		font-weight: 500;
		text-decoration: none;
		padding: 13px 24px;
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

	.footer {
		clear: both;
		padding: 24px 0;
		width: 100%;
	}

	.footer td,
	.footer p,
	.footer span,
	.footer a {
		color: #101517;
		font-size: 12px;
	}

	h1 {
		font-size: 20px;
	}

	p {
		font-family: sans-serif;
		font-size: 16px;
		font-weight: normal;
		margin: 0;
		margin-bottom: 16px;
	}

	.powered-by a {
		text-decoration: none;
	}

	@media only screen and (max-width: 640px) {
		.main p,
		.main td,
		.main span {
			font-size: 16px !important;
		}

		.wrapper {
			padding: 8px 16px !important;
		}

		.powered-by {
			padding: 0 16px 16px!important;
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

		.collapse { display: none; }

		h1 { padding:0 16px; }
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
