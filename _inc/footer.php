			<div class="footer">
				<?php /* if ( ! $is_connected || ! $is_user_connected ) : ?>
				<div class="fly">
					<a href="<?php echo $this->build_connect_url() ?>" class="download-jetpack">Connect to WordPress.com</a>
				</div>
				<?php endif; */?>
			
				<nav class="primary nav-horizontal">
					<div class="a8c-attribution">
						<span>An <a href="http://automattic.com/" class="a8c-logo">Automattic</a> Airline</span>
					</div>
				</nav><!-- .primary -->
			
				<nav class="secondary nav-horizontal">
					<div class="secondary-footer">
						<a href="http://jetpack.me">Jetpack <?php echo JETPACK__VERSION; ?></a>
						<a href="http://wordpress.com/tos/">Terms</a>
						<a href="http://automattic.com/privacy/">Privacy</a>
						<a href="admin.php?page=jetpack-debugger" title="Contact the Jetpack Happiness Squad.">Debug</a>
						<a href="/support/" title="Contact the Jetpack Happiness Squad.">Support</a>
						<a href="http://jetpack.me/survey/?rel=<?php echo JETPACK__VERSION; ?>" title="Take a survey.  Tell us how we're doing.">Give Us Feedback</a>
					</div>
				</nav><!-- .secondary -->
			</div><!-- .footer -->
		</div><!-- .wrapper -->
		<div class="modal"></div>
		<div class="shade"></div>
	</div><!-- .jp-frame -->
</div><!-- .jp-content -->
<script>
	var modules = [
		{
			"active" : true,
			"added" : 31,
			"desc" : "Add a link to your Google+ in the sharing area of posts and add your blog URL to your G+ profile.",
			"hasConfig" : true,
			"name" : "Google+ Profile",
			"new" : true,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/google-plus/"
		},
		{
			"active" : false,
			"added" : 30,
			"desc" : "Quite possibly the easiest way to upload beautiful videos to your blog.",
			"hasConfig" : true,
			"name" : "VideoPress",
			"new" : true,
			"paid" : true,
			"pop" : 2,
			"url" : "/support/videopress/"
		},
		{
			"active" : false,
			"added" : 29,
			"desc" : "Control which pages your widgets appear on with Widget Visibility.",
			"hasConfig" : true,
			"name" : "Widget Visibility",
			"new" : false,
			"paid" : false,
			"pop" : 5,
			"url" : "/support/widget-visibility/"
		},
		{
			"active" : true,
			"added" : 28,
			"desc" : "Let users login with their WordPress.com Credentials, through WordPress.com Connect.",
			"hasConfig" : true,
			"name" : "Jetpack Single Sign On",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/sso/"
		},
		{
			"active" : false,
			"added" : 27,
			"desc" : "A single search box, that lets you search many different things.",
			"hasConfig" : false,
			"name" : "Omnisearch",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/omnisearch/"
		},
		{
			"active" : false,
			"added" : 26,
			"desc" : "Likes are a way for people to show their appreciation for content you have written.",
			"hasConfig" : false,
			"name" : "Likes",
			"new" : false,
			"paid" : false,
			"pop" : 1,
			"url" : "/support/likes/"
		},
		{
			"active" : false,
			"added" : 25,
			"desc" : "Connect your site to popular social networks and automatically share new posts with your friends.",
			"hasConfig" : false,
			"name" : "Publicize",
			"new" : false,
			"paid" : false,
			"pop" : 1,
			"url" : "/support/publicize/"
		},
		{
			"active" : false,
			"added" : 24,
			"desc" : "Simple, concise site stats with no additional load on your server.",
			"hasConfig" : false,
			"name" : "WordPress.com Stats",
			"new" : false,
			"paid" : false,
			"pop" : 1,
			"url" : "/support/wordpress-com-stats/"
		},
		{
			"active" : false,
			"added" : 23,
			"desc" : "Monitor and manage your site’s activity in your Toolbar and on WordPress.com.",
			"hasConfig" : false,
			"name" : "Notifications",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/toolbar-notifications/"
		},
		{
			"active" : false,
			"added" : 22,
			"desc" : "A new comment system that has integrated social media login options.",
			"hasConfig" : false,
			"name" : "Jetpack Comments",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/comments/"
		},
		{
			"active" : false,
			"added" : 21,
			"desc" : "Allow users to subscribe to your posts and comments to receive a notification via email.",
			"hasConfig" : false,
			"name" : "Subscriptions",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/subscriptions/"
		},
		{
			"active" : false,
			"added" : 20,
			"desc" : "Transform your standard image galleries into an immersive full-screen experience.",
			"hasConfig" : false,
			"name" : "Carousel",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/carousel/"
		},
		{
			"active" : false,
			"added" : 19,
			"desc" : "Publish posts to your blog directly from your personal email account.",
			"hasConfig" : false,
			"name" : "Post By Email",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/post-by-email/"
		},
		{
			"active" : false,
			"added" : 18,
			"desc" : "The best sharing tool on the interwebs. Share content with Facebook, Twitter, and many more.",
			"hasConfig" : false,
			"name" : "Sharing",
			"new" : false,
			"paid" : false,
			"pop" : 1,
			"url" : "/support/sharing/"
		},
		{
			"active" : false,
			"added" : 17,
			"desc" : "Improve your spelling, style, and grammar with the After the Deadline proofreading service.",
			"hasConfig" : false,
			"name" : "Spelling and Grammar",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/spelling-and-grammar/"
		},
		{
			"active" : false,
			"added" : 16,
			"desc" : "Realtime backup and security scanning for your WordPress site.",
			"hasConfig" : false,
			"name" : "VaultPress",
			"new" : false,
			"paid" : true,
			"pop" : 3,
			"url" : "/support/vaultpress/"
		},
		{
			"active" : false,
			"added" : 15,
			"desc" : "Show a pop-up business card of your users&#8217; Gravatar profiles in comments.",
			"hasConfig" : false,
			"name" : "Gravatar Hovercards",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/gravatar-hovercards/"
		},
		{
			"active" : false,
			"added" : 14,
			"desc" : "Easily insert a contact form any where on your site.",
			"hasConfig" : false,
			"name" : "Contact Form",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/contact-form/"
		},
		{
			"active" : false,
			"added" : 13,
			"desc" : "Create elegant magazine-style mosaic layouts for your photos without using a graphic editor.",
			"hasConfig" : false,
			"name" : "Tiled Galleries",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/tiled-galleries/"
		},
		{
			"active" : false,
			"added" : 12,
			"desc" : "Enable WP.me-powered shortlinks for all of your Posts and Pages for easier sharing.",
			"hasConfig" : false,
			"name" : "WP.me Shortlinks",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/wp-me-shortlinks/"
		},
		{
			"active" : false,
			"added" : 11,
			"desc" : "Customize the look of your site without modifying your theme.",
			"hasConfig" : false,
			"name" : "Custom CSS",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/custom-css/"
		},
		{
			"active" : false,
			"added" : 10,
			"desc" : "Easily embed videos and more from sites like YouTube, Vimeo, and SlideShare.",
			"hasConfig" : false,
			"name" : "Shortcode Embeds",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/shortcode-embeds/"
		},
		{
			"active" : false,
			"added" : 9,
			"desc" : "Automatically optimize your site for mobile devices.",
			"hasConfig" : false,
			"name" : "Mobile Theme",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/mobile-theme/"
		},
		{
			"active" : false,
			"added" : 8,
			"desc" : "Add complex mathematical equations to your posts with the LaTeX markup language.",
			"hasConfig" : false,
			"name" : "Beautiful Math",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/beautiful-math/"
		},
		{
			"active" : false,
			"added" : 7,
			"desc" : "Easily add images, Twitter updates, and your site’s RSS links to your theme’s sidebar.",
			"hasConfig" : false,
			"name" : "Extra Sidebar Widgets",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/extra-sidebar-widgets/"
		},
		{
			"active" : false,
			"added" : 6,
			"desc" : "Automatically show the next set of posts when the reader approaches the bottom of the page.",
			"hasConfig" : false,
			"name" : "Infinite Scroll",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/infinite-scroll/"
		},
		{
			"active" : false,
			"added" : 5,
			"desc" : "Give your site a boost by loading images from the WordPress.com content delivery network.",
			"hasConfig" : false,
			"name" : "Photon",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/photon/"
		},
		{
			"active" : false,
			"added" : 4,
			"desc" : "Allow applications to securely access your content through the cloud.",
			"hasConfig" : false,
			"name" : "JSON API",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/json-api/"
		},
		{
			"active" : false,
			"added" : 3,
			"desc" : "Jetpack Monitor will keep tabs on your site, and alert you if your site goes offline.",
			"hasConfig" : false,
			"name" : "Monitor",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/monitor/"
		},
		{
			"active" : false,
			"added" : 2,
			"desc" : "Receive notifications on your Apple device.",
			"hasConfig" : false,
			"name" : "Mobile Push Notifications",
			"new" : false,
			"paid" : false,
			"pop" : 3,
			"url" : "/support/mobile-push-notifications/"
		},
		{
			"active" : false,
			"added" : 1,
			"desc" : "Share your public posts and comments to search engines and other services in real-time.",
			"hasConfig" : false,
			"name" : "Enhanced Distribution",
			"new" : false,
			"paid" : false,
			"pop" : 2,
			"url" : "/support/enhanced-distribution/"
		}
	];
</script>
