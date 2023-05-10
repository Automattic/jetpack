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

use Automattic\Jetpack\Redirect;

$text_dir = is_rtl() ? 'rtl' : 'ltr';

// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- used in grunion-contact-form.php
$template = '
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
	<title>' . esc_html__( 'Jetpack Forms Response', 'jetpack' ) . '</title>
		<meta http-equiv="Content-Type" content="text/html charset=UTF-8">
		<meta http-equiv="Content-Language" content="en-us">
<!--[if lt mso 12]>
<style type="text/css">
	.outlook-hide-pre-2007 {
		height:0 !important;
		max-height:0 !important; /* Gmail*/
		display:none !important; /* Generic*/
		mso-hide:all !important; /* Outlook clients*/
		overflow:hidden !important; /* Generic */
		font-size:0 !important; /* Be careful with this one, only use if absolutely required */
	}
	h1,h2,h3,h4 {
		margin: 0 !important;
		padding: 0 !important;
	}
	table.footer tr td.top {
		height: 40px !important;
	}
	p.btn-calltoaction {
		margin-top: 0 !important;
		margin-bottom: 0 !important;
	}
</style>
<![endif]--><!--[if (gte mso 9)|(IE)]>
<style type="text/css">
	body, .body-wrap {
		font-size: 1em !important;
		text-align: center !important;
	}
	h1,h2,h3,h4 {
		margin: 0 0 1em !important;
	}
	h1 {
		margin-top: 0 !important;
		margin-bottom: 2em !important;
		font-size: 1.5em !important;
	}
	h2 {
		font-size: 1.125em !important;
		margin-top: 1em !important;
		margin-bottom: 1em !important;
	}
	h5 {
		font-size: 1em !important;
	}
	h1, h2 {
		font-weight: bold !important;
	}
	p, ul, ol {
		font-size: 1.125em !important;
		margin-bottom: 1em !important;
	}
	.container {
		width: 40em !important;
		text-align: left !important;
	}
	.content-mc-region {
		margin-bottom: 2.5em !important;
		text-align: left !important;
	}
	.content-mc-region p,
	.content-mc-region ul,
	.content-mc-region ol {
		font-size: 1.125em !important;
	}
	.content-mc-region ol,
	.content-mc-region ul {
		padding-right: 0;
		padding-top: 0;
	}
	.content-mc-region ol {
		padding-left: 25px;
	}
	ol, ul {
		margin: 0 0 0 1.5em !important;
		padding: 0 !important;
		list-style-position: inside !important;
	}
	li {
		padding-left: 0
		margin-left: 0 !important;
		margin-bottom: 0.5em !important;
	}
	p.btn-calltoaction {
		margin-top: 2.5em !important;
		margin-bottom: 2.5em !important;
	}
	.btn-calltoaction a {
		border: solid 0.375em #03AADC !important;
		padding: 0 !important;
		color: #FFFFFF !important;
	}
	td.avatar {
		padding-top: 1.25em !important;
		padding-right: 1.25em !important;
		padding-bottom: 1.25em !important;
	}
	td.banner {
		padding-bottom: 2.25em !important;
	}
	.app-download {
		border: 0 !important;
		background-color: transparent !important;
	}
	.app-download td {
		padding: 0 !important;
	}
	.extra-cta {
		padding: 0 !important;
	}
	table.footer tr td.top {
		padding-top: 1.4em !important;
	}
	table.footer tr td.bottom {
		padding-bottom: 1.4em !important;
	}
	table.footer tr td.tw,
	table.footer tr td.fb {
		padding: 0.875em !important;
		padding-top: 0 !important;
	}
	.signature {
		margin-bottom: 2.25em !important;
	}
	.signature td.text {
		text-align: left !important;
	}
	table.footer p a {
		color: #000000 !important;
	}
	.outlook-hide {
		max-height:0 !important; /* Gmail*/
		display:none !important; /* Generic*/
		mso-hide:all !important; /* Outlook clients*/
		overflow:hidden !important; /* Generic */
		font-size:0 !important; /* Be careful with this one, only use if absolutely required */
	}
</style>
<![endif]-->
		<style type="text/css">
			@media screen and (max-width: 599px) {
				#table_body{margin: 0px !important;}.wrapper{width: 100%% !important;min-width: 0 !important;}
				h1{font-size: 26px !important; line-height: 30px !important;}
				h2{font-size: 22px !important; line-height: 26px !important;}
				p{font-size: 16px !important; line-height: 24px !important;}
			}
			@media screen and ( min-width: 599px) {
				td.jetpack-header{padding-right: 56px !important; padding-left: 56px !important;}
			}
			@media screen and ( max-width: 599px ) {
				tr.jetpack-onboarding-hero-section > td{padding-left: 24px !important; padding-right: 24px !important;}
				h1.jetpack-onboarding-hero-title-text{font-size: 36px !important; line-height: 1.2 !important;}
			}
			@media screen and ( min-width: 600px ) {
				td.jetpack-new-onboarding-section{padding: 40px 56px !important;}
				h2.jetpack-new-onboarding-section-header-text{font-size: 32px !important;}
				td.jetpack-onboarding-video-section,td.build-your-own-jetpack-new-section{padding: 48px 56px !important;}
				h2.build-your-own-jetpack-new-section-header-text{font-size: 32px !important;}
			}
			@media screen and ( max-width: 599px ) {
				td.footer-november-2022{padding-left: 24px !important; padding-right: 24px !important;}
				p.footer-november-2022-body-text{font-size: 14px !important;}
				p.footer-november-2022-address-text,p.footer-november-2022-unsub-text{font-size: 12px !important;width: 215px;}
			}
		</style>
	</head>
	<body style="-webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; height: 100%%; font-size: 1em; margin: 0; padding: 0; background: #DCDCDE; font-family: \'Helvetica Neue\', \'Helvetica\', Helvetica, Arial, sans-serif; direction: ' . $text_dir . '; width: 100%%; clear: both;">
		<span class="preheader" style="color: #DCDCDE; font-size: 1px; display:none;">' . esc_html__( 'Export your form responses to Google Sheets with just one click', 'jetpack' ) . '</span>
		<table id="table_body" cellspacing="0" role="presentation" style="border-collapse: collapse; width: 100%%; padding: 0; margin: 15px 0; background: #DCDCDE; border: 0;">
			<tbody>
				<tr>
					<td style="border-collapse: collapse;">
						<table id="table_wrapper" class="wrapper" width="600" align="center" cellpadding="0" cellspacing="0" bgcolor="#ffffff" role="presentation" style="border-collapse: collapse; background: #ffffff; margin: 0 auto; min-width: 600px; margin-top: 10px;">
							<tbody>
								<tr>
									<td align="left" class="jetpack-header" style="border-collapse: collapse; padding: 48px 24px 0px 24px;">
										<img alt height="32" src="' . GRUNION_PLUGIN_URL . 'images/jetpack-logo-horizontal-dark-green.png" width="117" style="border: 0 none; height: auto; line-height: 100%%; outline: none; text-decoration: none; display: inline-block;">
									</td>
								</tr>
								<tr class="jetpack-new-onboarding" style="font-family: \'SF Pro Display\', Helvetica, Arial, sans-serif;">
									<td class="jetpack-new-onboarding-section" align="left" style="border-collapse: collapse; padding: 32px 24px;font-size: 16px">
										<h1 class="jetpack-onboarding-hero-title-text" style="color: #101517; font-style: normal; font-weight: normal; line-height: 1.2; text-align:left; font-size: 36px;">
											%1$s
										</h1>
										<p>%2$s</p>
										<p><a class="build-your-own-jetpack-new-section-link" href="%3$s" style="color: #000; display: inline-block; box-sizing: border-box; line-height: 24px; letter-spacing: -0.02em; text-decoration: none; padding: 12px 24px; border: 1px solid #000; border-radius: 4px; font-size: 16px;">' . esc_html__( 'View Response', 'jetpack' ) . '</a></p>
										%5$s
									</td>
								</tr>
								<tr>
									<td class="build-your-own-jetpack-new-section" align="left" style="border-collapse: collapse; background-color: #F9F9F6; font-family: \'SF Pro Display\', Helvetica, Arial, sans-serif; padding: 32px 24px;">
										<span class="build-your-own-jetpack-new-section-eyebrow" style="direction: ' . $text_dir . '; color: #008710; font-weight: 600; line-height: 1.8; font-size: 16px;">' . esc_html__( 'Did you know?', 'jetpack' ) . '</span>
										<h2 class="build-your-own-jetpack-new-section-header-text" style="direction: ' . $text_dir . '; font-size: 26px; font-weight: 600; line-height: 1.2; margin: 16px 0;">' . esc_html__( 'Export your form responses to Google Sheets with just one click', 'jetpack' ) . '</h2>
										<img alt class="jetpack-onboarding-hero-image" src="' . GRUNION_PLUGIN_URL . 'images/jetpack-forms-google-sheets-hero.jpg" width="500" style="border: 0 none; height: auto; line-height: 100%%; outline: none; text-decoration: none; display: inline-block; max-width: 100%%;">
										<p class="build-your-own-jetpack-new-section-body-text" style="direction: ' . $text_dir . '; letter-spacing: -0.02em; line-height: 1.5; margin-bottom: 24px; font-size: 16px;">' . esc_html__( 'Exporting form responses to Google Sheets allows you to easily manage and analyze the data collected through your forms. This feature can be useful for analysing customer feedback, conducting market research, or organizing event registration information.', 'jetpack' ) . '</p>

										<a class="build-your-own-jetpack-new-section-link" href="https://jetpack.com/support/jetpack-blocks/contact-form/#export-form-responses" style="background-color: #000; border-radius: 4px; display: inline-block; box-sizing: border-box; color: #fff; font-weight: 600; letter-spacing: -0.02em;line-height: 24px; padding: 12px 24px; text-decoration: none; font-size: 16px;">' . esc_html__( 'Learn more', 'jetpack' ) . '</a>
									</td>
								</tr>
								<tr>
									<td class="footer-november-2022" style="border-collapse: collapse; font-family: \'SF Pro Display\', Helvetica, Arial, sans-serif; padding: 48px 56px;">
										<table style="border-collapse: collapse; width: 100%%;">
											<tr>
												<td style="border-collapse: collapse;">
													<img src="' . GRUNION_PLUGIN_URL . 'images/jetpack-icon.png" class="footer-november-2022-jetpack-icon" width="20" height="20" style="border: 0 none; height: auto; line-height: 100%%; outline: none; text-decoration: none; display: inline-block; margin-bottom: 16px;">
												</td>
											</tr>
											<tr>
												<td align="left" style="border-collapse: collapse;">
												<h2 class="footer-november-2022-header-text" style="direction: ' . $text_dir . '; color: #101517; font-size: 16px; line-height: 1.2; margin-bottom: 8px; margin-top: 0;">' . esc_html__( 'Get Jetpack on the go', 'jetpack' ) . '</h2>

													<p class="footer-november-2022-body-text" style="direction: ' . $text_dir . '; color: #3c434a; font-size: 14px; line-height: 1.4; margin-bottom: 16px; margin-top: 0;">' . esc_html__( 'View site activity and stats, get notifications when your site is down, fix malware threats, and restore your site from anywhere.', 'jetpack' ) . '</p>
												</td>
											</tr>
											<tr>
												<td align="left" class="footer-november-2022-app-links" style="border-collapse: collapse;">
													<a href="' . esc_url( Redirect::get_url( 'jetpack-android' ) ) . '" style="color: #00AADC; text-decoration: none; width: 115px; display: inline-block; margin-bottom: 64px;"><img src="' . GRUNION_PLUGIN_URL . 'images/play-store-badge.png" class="footer-november-2022-app-image" width="115" height="33" style="line-height: 100%%;outline: none; text-decoration: none; border: 0 none; display: inline-block; height: 33px;"></a>

													<a href="' . esc_url( Redirect::get_url( 'jetpack-ios' ) ) . '" style="color: #00AADC; text-decoration: none; width: 115px; display: inline-block; margin-bottom: 64px;"><img src="' . GRUNION_PLUGIN_URL . 'images/app-store-badge.png" class="footer-november-2022-app-image" width="115" height="33" style="line-height: 100%%; outline: none; text-decoration: none; border: 0 none; display: inline-block; height: 33px;"></a>
												</td>
											</tr>
											<tr>
												<td align="left" class="footer-november-2022-socials-section" style="border-collapse: collapse;">
													<a href="https://twitter.com/jetpack" style="color: #00AADC; text-decoration: none; display: inline-block; padding-right: 22px;"><img aria-label="' . esc_html__( 'jetpack twitter page', 'jetpack' ) . '" src="' . GRUNION_PLUGIN_URL . 'images/twitter-dark.png" width="20" height="20" style="height: auto; line-height: 100%%; outline: none; text-decoration: none; border: 0 none; display: inline-block;"></a>

													<a href="https://www.facebook.com/jetpackme" style="color: #00AADC; text-decoration: none; display: inline-block; padding-right:22px;"><img aria-label="' . esc_html__( 'jetpack facebook page', 'jetpack' ) . '" src="' . GRUNION_PLUGIN_URL . 'images/facebook-dark.png" width="20" height="20" style="height: auto; line-height:100%%; outline: none; text-decoration: none; border: 0 none; display: inline-block;"></a>

													<a href="https://www.linkedin.com/company/jetpack-for-wordpress/" style="color: #00AADC; text-decoration: none; display: inline-block; padding-right: 22px;"><img aria-label="' . esc_html__( 'jetpack linkedin page', 'jetpack' ) . '" src="' . GRUNION_PLUGIN_URL . 'images/linkedin-dark.png" width="20" height="20" style="height: auto; line-height:100%%; outline: none; text-decoration: none; border: 0 none; display: inline-block;"></a>
												</td>
											</tr>
											<tr>
												<td align="left" style="border-collapse: collapse;">
													<p class="footer-november-2022-address-text" style="direction: ' . $text_dir . '; color: #101517; font-size: 12px; line-height: 1.5; margin-bottom: 10px; margin-top: 24px;">
													<b style="font-weight: 600;">Automattic, Inc.</b> - 60 29th St. #343, San Francisco, CA 94110</b>
													</p>
												</td>
											</tr>
											<tr>
												<td align="left" style="border-collapse: collapse;">
													<p class="footer-november-2022-unsub-text" style="direction: ' . $text_dir . '; color: #101517; font-size: 12px; line-height: 1.5;">
													<b style="font-weight: 600;">' . esc_html__( 'Don’t want these emails?', 'jetpack' ) . '</b>
													<a href="%4$s" class="unsub" style="text-decoration: none; color: #101517;">' . esc_html__( 'Change the email address on your form', 'jetpack' ) . '</a>.
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
	</body>
</html>
';
