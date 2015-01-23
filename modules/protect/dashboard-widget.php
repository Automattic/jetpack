<style type="text/css">

/* Important: Need to move all css into modular scss – @jeffgolenski */


/* 
==========================================================================
// Jetpack Protect Widget
==========================================================================
*/

#protect_dashboard_widget .inside {
	margin: 0;
	padding: 0;
	text-align: center;
}

.jetpack-security * {
	box-sizing: border-box;
}

.blocked-attacks,
.file-scanning {
	position: relative;
}

.blocked-attacks {
	background: #fafafa;
	border-bottom: 1px #eee solid;
	padding-bottom: 35px;
}

.blocked-attacks h2, 
.blocked-attacks h3 {
	color: #7BAC48;
	font-family: "proxima-nova", "Open Sans", Helvetica, Arial, sans-serif;
	font-weight: 300;
}

.blocked-attacks h2 {
	font-size: 4em;
	line-height: 110%;
	margin: 0;
	padding: 10px 12px 10px 12px;
}

.blocked-attacks h3 {
	font-size: 1.1em;
	line-height: 110%;
	padding: 0 12px 10px 12px;
	margin: 0;
}

.jetpack-protect-logo {
	width: 50px;
	/* height: 55px;  just for testing. remove once image is actually added */
	position: relative;
}

.file-scanning {
	margin-top: -30px;
	padding: 0 12px;
}

</style>



<!-- ROCCO (or SAM) can you turn all the HTML comments into php comments when you build it out? Thanks! -->

<div class="jetpack-security">
	<div class="blocked-attacks">

		<div class="jetpack-security-sharing jetpack-modules">
			<a class="genericon genericon-twitter"></a>
			<a class="genericon genericon-facebook-alt"></a>
		</div><!-- /jetpack-security-sharing -->

		<h2 title="Jetpack Security has blocked [value] malicious login attempts on [site name]">27,386</h2>
		<h3>Malicious login attempts have been blocked.</h3>

	</div><!-- /blocked-attacks -->
	<div class="file-scanning">

		<img src="<?php echo plugin_dir_url( JETPACK__PLUGIN_FILE );?>images/jetpack-protect-shield.svg" class="jetpack-protect-logo" alt="Jetpack Protect Logo" />

		<p>With Jetpack Protect already effectively blocking bot net attacks, we want to help harden your site security by scanning your server for any malicious files that may exist.</p>

		<a href="#" class="button-primary" title="Enable File Scanning">Enable File Scanning</a>

		<p><small>Having your SSH credentials will allow us to securely scan your files at the highest possible performance levels.</small></p>

	</div><!-- /file-scanning -->
</div> <!-- /jetpack security -->