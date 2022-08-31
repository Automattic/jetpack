/**
 * List of all files and directories
 * that we do not need to keep in sync between Jetpack and WordPress.com anymore.
 *
 * Notes:
 * Make sure to keep this list up to date as you remove files from build-plugin-files.php on WordPress.com.
 * Keep this list in alphabetical order.
 */
const deFusionedFiles = [
	'projects/plugins/jetpack/_inc/crowdsignal-shortcode.js',
	'projects/plugins/jetpack/_inc/crowdsignal-survey.js',
	'projects/plugins/jetpack/_inc/facebook-embed.js',
	'projects/plugins/jetpack/_inc/genericons.php',
	'projects/plugins/jetpack/_inc/genericons/',
	'projects/plugins/jetpack/_inc/polldaddy-shortcode.js',
	'projects/plugins/jetpack/_inc/twitter-timeline.js',
	'projects/plugins/jetpack/class.jetpack-post-images.php',
	'projects/plugins/jetpack/class.jetpack-twitter-cards.php',
	'projects/plugins/jetpack/functions.photon.php',
	'projects/plugins/jetpack/modules/carousel.php',
	'projects/plugins/jetpack/modules/carousel/',
	'projects/plugins/jetpack/modules/cloudflare-analytics/',
	'projects/plugins/jetpack/modules/copy-post.php',
	'projects/plugins/jetpack/modules/google-analytics/',
	'projects/plugins/jetpack/modules/google-fonts.php',
	'projects/plugins/jetpack/modules/memberships/',
	'projects/plugins/jetpack/modules/publicize.php',
	'projects/plugins/jetpack/modules/seo-tools/',
	'projects/plugins/jetpack/modules/shortcodes/',
	'projects/plugins/jetpack/modules/shortcodes/js/brightcove.js',
	'projects/plugins/jetpack/modules/sitemaps',
	'projects/plugins/jetpack/modules/theme-tools/compat/',
	'projects/plugins/jetpack/modules/theme-tools/site-logo.php',
	'projects/plugins/jetpack/modules/theme-tools/site-logo/inc/compat.php',
	'projects/plugins/jetpack/modules/theme-tools/site-logo/inc/functions.php',
	'projects/plugins/jetpack/modules/theme-tools/site-logo/js/site-logo-header-text.js',
	'projects/plugins/jetpack/modules/widget-visibility/widget-conditions.php',
	'projects/plugins/jetpack/modules/widget-visibility/widget-conditions/',
	'projects/plugins/jetpack/modules/widget-visibility/editor/',
	'projects/plugins/jetpack/modules/widgets/',
	'projects/plugins/jetpack/readme.txt',
	'projects/plugins/jetpack/src/',
];

module.exports = deFusionedFiles;
