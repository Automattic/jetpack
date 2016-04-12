module.exports = {
	dotcomTools: {
		features: [{
			name: 'Manage multiple sites',
			description: 'Bulk site management from one dashboard.',
			activated: true
		}, {
			name: 'Automatic Updates',
			description: 'Keep plugins auto-updated.',
			activated: true
		}, {
			name: 'Centralized Posting',
			description: 'Post to your sites via mobile devices.',
			activated: true
		}, {
			name: 'Menu Management',
			description: 'A simpler UI for creating and editing menus.',
			activated: true
		}, {
			name: 'More Statistics',
			description: 'Enhanced site stats and insights.',
			activated: true
		}]
	},
	modules: {
		items: {
			'stats': {},
			'protect': {
				'name': 'Protect',
				'description': 'Prevent brute force attacks.',
				'jumpstart_desc': '',
				'sort': 1,
				'recommendation_order': 4,
				'introduced': '3.4',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Recommended'
				],
				'feature': [
					'Recommended',
					'Performance-Security'
				],
				'additional_search_queries': 'security, secure, protection, botnet, brute force, protect, login',
				'module': 'protect',
				'activated': true,
				'deactivate_nonce': '6c975230ee',
				'activate_nonce': '51c2e4ee8d',
				'available': true,
				'short_description': 'Prevent brute force attacks.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=protect',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/protect\/">Learn More<\/a>',
				'long_description': '\t<p>Protect is a cloud-powered brute force attack prevention tool. We leverage the millions of WordPress sites to identify and block malicious IPs.\n\nProtect tracks failed login attempts across all Jetpack-connected sites using the Protect module.  If any single IP has too many failed attempts in a short period of time, they are blocked from logging in to any site with this plugin installed.\n\nProtect is derived from BruteProtect, and will disable BruteProtect on your site if it is currently enabled.<\/p>',
				'search_terms': 'security, secure, protection, botnet, brute force, protect, login',
				'configurable': false
			},
			'manage': {
				'name': 'Manage',
				'description': 'Manage all your sites from a centralized place, https:\/\/wordpress.com\/sites.',
				'jumpstart_desc': 'Helps you remotely manage plugins, turn on automated updates, and more from <a href="https:\/\/wordpress.com\/plugins\/" target="_blank">wordpress.com<\/a>.',
				'sort': 1,
				'recommendation_order': 3,
				'introduced': '3.4',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Centralized Management',
					'Recommended'
				],
				'feature': [
					'Recommended',
					'Jumpstart'
				],
				'additional_search_queries': 'manage, management, remote',
				'module': 'manage',
				'activated': true,
				'deactivate_nonce': 'da91b79b46',
				'activate_nonce': 'ce4ab21c7b',
				'available': true,
				'short_description': 'Manage all your sites from a centralized place, https:\/\/wordpress.com\/sites.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=manage',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/site-management\/">Learn More<\/a>',
				'long_description': '\n\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/manage.jpg" alt="Manage all of your WordPress sites, self-hosted or not, from WordPress.com" width="300" height="150" \/>\n\t<\/div>\n\n\t<p><em>Enabling Manage allows you to update your self-hosted WordPress sites along with any WordPress.com sites you have, all in one simple dashboard.<\/em><\/p>\n\t<p><strong>Plugins<\/strong><br \/>\n\t\tNow you can update plugins, set plugins to automatically update, and activate or deactivate plugins on a per-site basis or in bulk from <a href="https:\/\/wordpress.com\/plugins">wordpress.com\/plugins<\/a>.<\/p>\n\n\t<p><strong>Themes<\/strong><br \/>\n\t\tList your installed themes, search, and activate them from <a href="https:\/\/wordpress.com\/design">wordpress.com\/design<\/a>.<\/p>\n\n\t<p><strong>Menus<\/strong><br \/>\n\t\tCreate a new menu for your site, or edit existing menus from <a href="https:\/\/wordpress.com\/menus">wordpress.com\/menus<\/a>.<\/p>\n\n',
				'search_terms': 'manage, management, remote',
				'configurable': false
			},
			'custom-css': {
				'name': 'Custom CSS',
				'description': 'Customize your site\u2019s CSS without modifying your theme.',
				'jumpstart_desc': '',
				'sort': 2,
				'recommendation_order': 20,
				'introduced': '1.7',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Appearance'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'css, customize, custom, style, editor, less, sass, preprocessor, font, mobile, appearance, theme, stylesheet',
				'module': 'custom-css',
				'activated': true,
				'deactivate_nonce': '4ca2a2bfdf',
				'activate_nonce': '7efcc59818',
				'available': true,
				'short_description': 'Customize your site\u2019s CSS without modifying your theme.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=custom-css',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/custom-css.jpg" alt="Custom CSS" width="300" height="150" \/>\n\t<\/div>\n\n\t<p>The Custom CSS editor gives you the ability to add to or replace your theme&#039;s CSS, all while supplying syntax coloring, auto-indentation, and immediate feedback on the validity of the CSS you&#039;re writing.<\/p>\n\n\t\n\t\t<p>To use the CSS editor, go to Appearance &#8594; <a href="https:\/\/testsite.me\/wp-admin\/themes.php?page=editcss">Edit CSS<\/a>.<\/p>\n\n\t',
				'search_terms': 'css, customize, custom, style, editor, less, sass, preprocessor, font, mobile, appearance, theme, stylesheet',
				'configurable': false
			},
			'shortcodes': {
				'name': 'Shortcode Embeds',
				'description': 'Embed content from YouTube, Vimeo, SlideShare, and more, no coding necessary.',
				'jumpstart_desc': '',
				'sort': 3,
				'recommendation_order': 20,
				'introduced': '1.1',
				'changed': '1.2',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Photos and Videos',
					'Social',
					'Writing',
					'Appearance'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'shortcodes, shortcode, embeds, media, bandcamp, blip.tv, dailymotion, digg, facebook, flickr, google calendars, google maps, google+, polldaddy, recipe, recipes, scribd, slideshare, slideshow, slideshows, soundcloud, ted, twitter, vimeo, vine, youtube',
				'module': 'shortcodes',
				'activated': true,
				'deactivate_nonce': '1053b98ba8',
				'activate_nonce': '9e518d1706',
				'available': true,
				'short_description': 'Embed content from YouTube, Vimeo, SlideShare, and more, no coding necessary.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=shortcodes',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/en.support.wordpress.com\/shortcodes\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<a href="http:\/\/en.support.wordpress.com\/shortcodes\/">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/shortcodes.jpg" alt="Shortcode Embeds" width="300" height="150" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p>Shortcodes allow you to easily and safely embed media from other places in your site. With just one simple code, you can tell WordPress to embed YouTube, Flickr, and other media.<\/p>\n\t<p>Enter a shortcode directly into the Post\/Page editor to embed media. For specific instructions follow the links below.<\/p>\n\t\t<p>Available shortcodes are: <a href="http:\/\/support.wordpress.com\/archives-shortcode\/" target="_blank">[archives]<\/a>, <a href="http:\/\/en.support.wordpress.com\/audio\/bandcamp\/" target="_blank">[bandcamp]<\/a>, <a href="http:\/\/support.wordpress.com\/videos\/bliptv\/" target="_blank">[blip.tv]<\/a>, <a href="http:\/\/support.wordpress.com\/videos\/dailymotion\/" target="_blank">[dailymotion]<\/a>, <a href="http:\/\/en.support.wordpress.com\/facebook-integration\/facebook-embeds\/" target="_blank">[facebook]<\/a>, <a href="http:\/\/support.wordpress.com\/videos\/flickr-video\/" target="_blank">[flickr]<\/a>, <a href="http:\/\/en.support.wordpress.com\/gist\/" target="_blank">[gist]<\/a>, <a href="http:\/\/support.wordpress.com\/google-maps\/" target="_blank">[googlemaps]<\/a>, <a href="https:\/\/en.support.wordpress.com\/instagram\/instagram-images\/" target="_blank">[instagram]<\/a>, <a href="http:\/\/jetpack.me\/support\/subscriptions\/#display" target="_blank">[jetpack_subscription_form]<\/a>, <a href="http:\/\/support.polldaddy.com\/wordpress-shortcodes\/" target="_blank">[polldaddy]<\/a>, <a href="http:\/\/en.support.wordpress.com\/presentations\/" target="_blank">[presentation]<\/a>, <a href="http:\/\/en.support.wordpress.com\/recipes\/" target="_blank">[recipes]<\/a>, <a href="http:\/\/support.wordpress.com\/scribd\/" target="_blank">[scribd]<\/a>, <a href="http:\/\/support.wordpress.com\/slideshows\/slideshare\/" target="_blank">[slideshare]<\/a>, <a href="http:\/\/en.support.wordpress.com\/slideshows\/" target="_blank">[slideshow]<\/a>, <a href="http:\/\/support.wordpress.com\/audio\/soundcloud-audio-player\/" target="_blank">[soundcloud]<\/a>, <a href="http:\/\/en.support.wordpress.com\/videos\/ted-talks\/" target="_blank">[ted]<\/a>, <a href="http:\/\/en.support.wordpress.com\/widgets\/twitter-timeline-widget\/#embedding-with-a-shortcode" target="_blank">[twitter-timeline]<\/a>, <a href="http:\/\/support.wordpress.com\/videos\/vimeo\/" target="_blank">[vimeo]<\/a>, <a href="http:\/\/en.support.wordpress.com\/videos\/vine\/" target="_blank">[vine]<\/a>, <a href="http:\/\/support.wordpress.com\/videos\/youtube\/" target="_blank">[youtube]<\/a>, and <a href="http:\/\/en.support.wordpress.com\/videopress\/" target="_blank">[wpvideo (VideoPress)]<\/a>.<\/p>\n',
				'search_terms': 'shortcodes, shortcode, embeds, media, bandcamp, blip.tv, dailymotion, digg, facebook, flickr, google calendars, google maps, google+, polldaddy, recipe, recipes, scribd, slideshare, slideshow, slideshows, soundcloud, ted, twitter, vimeo, vine, youtube',
				'configurable': false
			},
			'widgets': {
				'name': 'Extra Sidebar Widgets',
				'description': 'Add images, Twitter streams, your site\u2019s RSS links, and more to your sidebar.',
				'jumpstart_desc': '',
				'sort': 4,
				'recommendation_order': 20,
				'introduced': '1.2',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Social',
					'Appearance'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'widget, widgets, facebook, gallery, twitter, gravatar, image, rss',
				'module': 'widgets',
				'activated': true,
				'deactivate_nonce': '8896fe4ca0',
				'activate_nonce': '0fbd2882dd',
				'available': true,
				'short_description': 'Add images, Twitter streams, your site\u2019s RSS links, and more to your sidebar.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=widgets',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/en.support.wordpress.com\/widgets\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/widgets.jpg" alt="Widgets Screenshot" width="300" height="150" \/>\n\t<\/div>\n\n\t<p><strong>The Twitter Widget<\/strong> shows your latest tweets within a sidebar on your theme.<\/p>\n\t<p><strong>The Facebook Like Box Widget<\/strong> shows your Facebook Like Box within a sidebar on your theme.<\/p>\n\t<p><strong>The Image Widget<\/strong> lets you easily add images to a sidebar on your theme.<\/strong> <\/p>\n\t<p><strong>The Gravatar Widget<\/strong> allows you to pull in your Gravatar image along with some of your Gravatar profile data.<\/p>\n\t<p><strong>The Gallery Widget<\/strong> provides you with a simple way to display a photo gallery or slideshow in your blog\u2019s sidebar. Requires the Tiled Gallery module.<\/p>\n\t<p><strong>The Display WordPress Posts Widget<\/strong> lets you display up to ten recent posts from another WordPress.com blog, or a self-hosted WordPress site with Jetpack enabled.<\/p>\n\t<p><strong>The Social Media Icons Widget<\/strong> lets you add icons for the most popular social networks to your sidebar or other widget area.<\/p>\n\t<!--<p><strong>The Upcoming Events Widget<\/strong> allows you to use an iCalendar link to display a list of events on your site.<\/p>-->\n\n\t<p>Each of these widgets has a number of customization options.  To use the widgets, go to Appearance &#8594; <a href="https:\/\/testsite.me\/wp-admin\/widgets.php">Widgets<\/a>. Drag them into one of your sidebars and configure away.<\/p>\n',
				'search_terms': 'widget, widgets, facebook, gallery, twitter, gravatar, image, rss',
				'configurable': false
			},
			'enhanced-distribution': {
				'name': 'Enhanced Distribution',
				'description': 'Increase reach and traffic.',
				'jumpstart_desc': '',
				'sort': 5,
				'recommendation_order': 20,
				'introduced': '1.2',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Public',
				'module_tags': [
					'Writing'
				],
				'feature': [
					'Traffic'
				],
				'additional_search_queries': 'google, seo, firehose, search, broadcast, broadcasting',
				'module': 'enhanced-distribution',
				'activated': true,
				'deactivate_nonce': '7cf7dfcb7d',
				'activate_nonce': 'c7a037466d',
				'available': true,
				'short_description': 'Increase reach and traffic.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=enhanced-distribution',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/en.wordpress.com\/firehose\/">Learn More<\/a>',
				'long_description': '\t<p>Jetpack will automatically take the great published content from your blog or website and share it instantly with third party services like search engines, increasing your reach and traffic.<\/p>\n',
				'search_terms': 'google, seo, firehose, search, broadcast, broadcasting',
				'configurable': false
			},
			'after-the-deadline': {
				'name': 'Spelling and Grammar',
				'description': 'Check your spelling, style, and grammar with the After the Deadline proofreading service.',
				'jumpstart_desc': '',
				'sort': 6,
				'recommendation_order': 20,
				'introduced': '1.1',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Writing'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'after the deadline, afterthedeadline, spell, spellchecker, spelling, grammar, proofreading, style, language, cliche',
				'module': 'after-the-deadline',
				'activated': true,
				'deactivate_nonce': 'c9267cdd99',
				'activate_nonce': 'dbdc4145b1',
				'available': true,
				'short_description': 'Check your spelling, style, and grammar with the After the Deadline proofreading service.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=after-the-deadline',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/en.support.wordpress.com\/proofreading\/">Learn More<\/a>',
				'long_description': "\t<div class=\"jp-info-img\">\n\t\t<a href=\"http:\/\/en.support.wordpress.com\/proofreading\/\">\n\t\t\t<img class=\"jp-info-img\" src=\"https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/spelling.jpg\" alt=\"Spelling and Grammar\" width=\"300\" height=\"150\" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p>The <a href='http:\/\/www.afterthedeadline.com\/'>After&nbsp;the&nbsp;Deadline<\/a> Proofreading service improves your writing by using artificial intelligence to find your errors and offer smart suggestions.<\/p>\n\t<p>After the Deadline provides a number of <a href=\"https:\/\/testsite.me\/wp-admin\/user\/profile.php#atd\">customization options<\/a>, which you can edit in your profile.<\/p>\n",
				'search_terms': 'after the deadline, afterthedeadline, spell, spellchecker, spelling, grammar, proofreading, style, language, cliche',
				'configurable': false
			},
			'sharedaddy': {
				'name': 'Sharing',
				'description': 'Visitors can share your content.',
				'jumpstart_desc': 'Twitter, Facebook and Google+ buttons at the bottom of each post, making it easy for visitors to share your content.',
				'sort': 7,
				'recommendation_order': 6,
				'introduced': '1.1',
				'changed': '1.2',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Social',
					'Recommended'
				],
				'feature': [
					'Recommended',
					'Jumpstart',
					'Traffic'
				],
				'additional_search_queries': 'share, sharing, sharedaddy, buttons, icons, email, facebook, twitter, google+, linkedin, pinterest, pocket, press this, print, reddit, tumblr',
				'module': 'sharedaddy',
				'activated': true,
				'deactivate_nonce': 'f4733ce558',
				'activate_nonce': '7ef51a6b30',
				'available': true,
				'short_description': 'Visitors can share your content.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=sharedaddy',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/support.wordpress.com\/sharing\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<embed type="application\/x-shockwave-flash" src="http:\/\/s0.videopress.com\/player.swf?v=1.02" height="190" wmode="transparent" seamlesstabbing="true" allowfullscreen="true" allowscriptaccess="always" overstretch="true" flashvars="guid=WV0JOwY2"><\/embed>\n\t<\/div>\n\t<p>Share your posts with Twitter, Facebook, and a host of other services. You can configure services to appear as icons, text, or both. Some services have additional options to display smart buttons, such as Twitter, which will update the number of times the post has been shared.<\/p>\n\n\t<p>The following services are included: Twitter, Facebook, Reddit, Digg, LinkedIn, Google +1, Print, and Email.<\/p>\n\n\t\n\t\t<p>To configure your sharing settings, go to the Settings &rarr; <a href="options-general.php?page=sharing">Sharing<\/a> menu.<\/p>\n\t\t<p>Drag and drop sharing services into the enabled section to have them show up on your site, and drag them into the hidden section to have them hidden behind a button.\n\t\t\n\t<p>Full details can be found on the <a href="http:\/\/support.wordpress.com\/sharing\/">Sharing support page<\/a>. This video also gives a swish run-down of how to use the Sharing feature. Watch it in HD for extra snazz!<\/p>\n',
				'search_terms': 'share, sharing, sharedaddy, buttons, icons, email, facebook, twitter, google+, linkedin, pinterest, pocket, press this, print, reddit, tumblr',
				'configurable': false
			},
			'shortlinks': {
				'name': 'WP.me Shortlinks',
				'description': 'Enable WP.me-powered shortlinks for all posts and pages.',
				'jumpstart_desc': '',
				'sort': 8,
				'recommendation_order': 20,
				'introduced': '1.1',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Social'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'shortlinks, wp.me',
				'module': 'shortlinks',
				'activated': true,
				'deactivate_nonce': 'a63593e194',
				'activate_nonce': '9392976ab1',
				'available': true,
				'short_description': 'Enable WP.me-powered shortlinks for all posts and pages.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=shortlinks',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/wp.me\/sf2B5-shorten">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<a href="http:\/\/wp.me\/sf2B5-shorten">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/shortlinks.jpg" alt="WP.me Shortlinks" width="300" height="150" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p>Instead of typing or copy-pasting long URLs, you can now get a short and simple link to your posts and pages. This uses the super compact wp.me domain name, and gives you a unique URL you can use that will be safe and reliable.<\/p>\n\t<p>It&#8217;s perfect for use on Twitter, Facebook, and cell phone text messages where every character counts.<\/p>\n\t<p>To use shortlinks, go to any already published post (or publish something new!). A &#8220;Get Shortlink&#8221; button will be visible under the Post title. When you click it, a dialog box will appear with the shortlink and you can copy and paste to Twitter, Facebook or wherever your heart desires.<\/p>\n',
				'search_terms': 'shortlinks, wp.me',
				'configurable': false
			},
			'subscriptions': {
				'name': 'Subscriptions',
				'description': 'Allow users to subscribe to your posts and comments and receive notifications via email.',
				'jumpstart_desc': 'Give visitors two easy subscription options \u2014 while commenting, or via a separate email subscription widget you can display.',
				'sort': 9,
				'recommendation_order': 8,
				'introduced': '1.2',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Social'
				],
				'feature': [
					'Jumpstart'
				],
				'additional_search_queries': 'subscriptions, subscription, email, follow, followers, subscribers, signup',
				'module': 'subscriptions',
				'activated': true,
				'deactivate_nonce': '9b0ff6bca0',
				'activate_nonce': '2833b9123d',
				'available': true,
				'short_description': 'Allow users to subscribe to your posts and comments and receive notifications via email.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=subscriptions',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/en.support.wordpress.com\/following\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/subscriptions.jpg" alt="Subsriptions Screenshot" width="300" height="150" \/>\n\t<\/div>\n\n\t<p>Easily allow any visitor to subscribe to all of your posts via email through a widget in your blog&#8217;s sidebar.  Every time you publish a post, WordPress.com will send a notification to all your subscribers.<\/p>\n\t<p>When leaving comments, your visitors can also subscribe to a post&#8217;s comments to keep up with the conversation.<\/p>\n\n\t<p>To use the Subscriptions widget, go to Appearance &#8594; <a href="https:\/\/testsite.me\/wp-admin\/widgets.php">Widgets<\/a>. Drag the widget labeled &#8220;Blog Subscriptions (Jetpack)&#8221; into one of your sidebars and configure away.<\/p>\n\t<p>You can also make changes to your Subscription settings at the bottom of the <a href="https:\/\/testsite.me\/wp-admin\/options-discussion.php#jetpack-subscriptions-settings">Discussion Settings<\/a> page.<\/p>\n\t<p>To customize the emails sent from your blog to your followers, check the settings at the bottom of the <a href="https:\/\/testsite.me\/wp-admin\/options-reading.php#follower-settings">Reading Settings<\/a> page.<\/p>\n',
				'search_terms': 'subscriptions, subscription, email, follow, followers, subscribers, signup',
				'configurable': false
			},
			'publicize': {
				'name': 'Publicize',
				'description': 'Automatically promote content.',
				'jumpstart_desc': '',
				'sort': 10,
				'recommendation_order': 7,
				'introduced': '2.0',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Social',
					'Recommended'
				],
				'feature': [
					'Recommended',
					'Traffic'
				],
				'additional_search_queries': 'facebook, twitter, google+, googleplus, google, path, tumblr, linkedin, social, tweet, connections, sharing',
				'module': 'publicize',
				'activated': true,
				'deactivate_nonce': '86ffa3b21d',
				'activate_nonce': 'eb5cd96da3',
				'available': true,
				'short_description': 'Automatically promote content.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=publicize',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/publicize\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<a href="http:\/\/en.support.wordpress.com\/publicize\/">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/publicize.jpg" alt="Publicize" width="328" height="123" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p>Publicize allows you to connect your blog to popular social networking sites and automatically share new posts with your friends.\t You can make a connection for just yourself or for all users on your blog.<\/p>\n\t<p>Publicize allows you to share your posts on Facebook, Twitter, Tumblr, Yahoo!, and Linkedin.<\/p>\n\n\n\t<p>&rarr; <a href="http:\/\/jetpack.me\/support\/publicize\/">More information on using Publicize.<\/a><\/p>\n',
				'search_terms': 'facebook, twitter, google+, googleplus, google, path, tumblr, linkedin, social, tweet, connections, sharing',
				'configurable': false
			},
			'gravatar-hovercards': {
				'name': 'Gravatar Hovercards',
				'description': 'Enable pop-up business cards over commenters\u2019 Gravatars.',
				'jumpstart_desc': 'Let commenters link their profiles to their Gravatar accounts, making it easy for your visitors to learn more about your community.',
				'sort': 11,
				'recommendation_order': 13,
				'introduced': '1.1',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Social',
					'Appearance'
				],
				'feature': [
					'Jumpstart'
				],
				'additional_search_queries': 'gravatar, hovercards',
				'module': 'gravatar-hovercards',
				'activated': true,
				'deactivate_nonce': '78506043ee',
				'activate_nonce': '618d5b8ae3',
				'available': true,
				'short_description': 'Enable pop-up business cards over commenters\u2019 Gravatars.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=gravatar-hovercards',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/blog.gravatar.com\/2010\/10\/06\/gravatar-hovercards-on-wordpress-com\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<a href="http:\/\/blog.gravatar.com\/2010\/10\/06\/gravatar-hovercards-on-wordpress-com\/">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/hovercards.jpg" alt="Gravatar Hovercard" width="300" height="150" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<h5>What&#8217;s a Hovercard?<\/h5>\n\t<p>Hovercards enhance plain Gravatar images with information about a person: name, bio, pictures, their contact info, and other services.<\/p>\n\t<p>To see hovercards, look at any blog post on your blog that has comments. If the commenter has a hovercard associated with their gravatar, mouse over their image and the hovercard will appear. To turn hovercards off, click the Deactivate button above.<\/p>\n',
				'search_terms': 'gravatar, hovercards',
				'configurable': false
			},
			'latex': {
				'name': 'Beautiful Math',
				'description': 'Use LaTeX markup language in posts and pages for complex equations and other geekery.',
				'jumpstart_desc': '',
				'sort': 12,
				'recommendation_order': 20,
				'introduced': '1.1',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Writing'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'latex, math, equation, equations, formula, code',
				'module': 'latex',
				'activated': true,
				'deactivate_nonce': 'f2084469a2',
				'activate_nonce': 'deb076ad9d',
				'available': true,
				'short_description': 'Use LaTeX markup language in posts and pages for complex equations and other geekery.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=latex',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/support.wordpress.com\/latex\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<a href="http:\/\/support.wordpress.com\/latex\/">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/beautifulmath.jpg" alt="LaTeX" width="300" height="150" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p><a href="http:\/\/www.latex-project.org\/" target="_blank"><img src="\/\/s0.wp.com\/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" \/><\/a> is a powerful markup language for writing complex mathematical equations, formulas, etc.<\/p>\n\t<p>Jetpack combines the power of <img src="\/\/s0.wp.com\/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" \/> and the simplicity of WordPress to give you the ultimate in math blogging platforms.<\/p>\n\t<p>Use <code>$latex your latex code here$<\/code> or <code>[latex]your latex code here[\/latex]<\/code> to include <img src="\/\/s0.wp.com\/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" \/> in your posts and comments. There are <a href="http:\/\/support.wordpress.com\/latex\/" target="_blank">all sorts of options<\/a> available.<\/p>\n\t<p>Wow, that sounds nerdy.<\/p>\n',
				'search_terms': 'latex, math, equation, equations, formula, code',
				'configurable': false
			},
			'notes': {
				'name': 'Notifications',
				'description': 'Receive notification of site activity via the admin toolbar and your Mobile devices.',
				'jumpstart_desc': '',
				'sort': 13,
				'recommendation_order': 20,
				'introduced': '1.9',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Other'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'notification, notifications, toolbar, adminbar, push, comments',
				'module': 'notes',
				'activated': true,
				'deactivate_nonce': '8b64f71504',
				'activate_nonce': '2ca697e125',
				'available': true,
				'short_description': 'Receive notification of site activity via the admin toolbar and your Mobile devices.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=notes',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/support.wordpress.com\/notifications\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<a href="http:\/\/support.wordpress.com\/notifications\/">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/notes.jpg" alt="Notifications" width="300" height="150" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p>Keep up with the latest happenings on all your WordPress sites and interact with other WordPress.com users.<\/p>\n\t<p>You can view your notifications in the Toolbar and <a href="http:\/\/wordpress.com\/#!\/notifications\/">on WordPress.com<\/a>.<\/p>\n',
				'search_terms': 'notification, notifications, toolbar, adminbar, push, comments',
				'configurable': false
			},
			'sitemaps': {
				'name': 'Sitemaps',
				'description': 'Creates sitemaps to allow your site to be easily indexed by search engines.',
				'jumpstart_desc': '',
				'sort': 13,
				'recommendation_order': 20,
				'introduced': '3.9',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Public',
				'module_tags': [
					'Recommended',
					'Traffic'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'sitemap, traffic, search, site map, seo',
				'module': 'sitemaps',
				'activated': true,
				'deactivate_nonce': '8eda3e354c',
				'activate_nonce': '7abb8e110c',
				'available': true,
				'short_description': 'Creates sitemaps to allow your site to be easily indexed by search engines.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=sitemaps',
				'learn_more_button': '',
				'long_description': '\t<p>This module creates an XML sitemap file that lists the URLs of posts and pages in your site with important information about each one.<\/p>\n\t<p>This file is accessed by search engines like Google or Bing so they can crawl and understand your site.<\/p>\n\t<p>&rarr; <a href="http:\/\/jetpack.me\/support\/sitemaps\/">More information on Sitemaps.<\/a><\/p>\n\t\t\t<p><strong>Your site is currently set to discourage search engines from indexing it so the sitemap will not be accessible.<\/strong><\/p>\n\t\t',
				'search_terms': 'sitemap, traffic, search, site map, seo',
				'configurable': false
			},
			'post-by-email': {
				'name': 'Post by Email',
				'description': 'Publish posts by email, using any device and email client.',
				'jumpstart_desc': '',
				'sort': 14,
				'recommendation_order': 20,
				'introduced': '2.0',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Writing'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'post by email, email',
				'module': 'post-by-email',
				'activated': true,
				'deactivate_nonce': '7bd1aa9f98',
				'activate_nonce': '86cd1a9af1',
				'available': true,
				'short_description': 'Publish posts by email, using any device and email client.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=post-by-email',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/post-by-email\/">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/post-by-email.jpg" alt="Post by Email" width="300" height="115" \/>\n\t<\/div>\n\n\t<p>Post by Email is a way of publishing posts on your blog by email. Any email client can be used to send the email, allowing you to publish quickly and easily from devices such as cell phones.<\/p>\n\n\t<p>Manage your Post By Email address from your <a href="https:\/\/testsite.me\/wp-admin\/user\/profile.php#post-by-email">profile settings<\/a>.\n\t<p>&rarr; <a href="http:\/\/jetpack.me\/support\/post-by-email\/">More information on sending emails, attachments, and customizing your posts.<\/a><\/p>\n\n',
				'search_terms': 'post by email, email',
				'configurable': false
			},
			'contact-form': {
				'name': 'Contact Form',
				'description': 'Insert a contact form anywhere on your site.',
				'jumpstart_desc': 'Adds a button to your post and page editors, allowing you to build simple forms to help visitors stay in touch.',
				'sort': 15,
				'recommendation_order': 14,
				'introduced': '1.3',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Other'
				],
				'feature': [
					'Jumpstart'
				],
				'additional_search_queries': 'contact, form, grunion, feedback, submission',
				'module': 'contact-form',
				'activated': true,
				'deactivate_nonce': 'a855f6d9a3',
				'activate_nonce': '5523b9dcce',
				'available': true,
				'short_description': 'Insert a contact form anywhere on your site.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=contact-form',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/support.wordpress.com\/contact-form\/">Learn More<\/a>',
				'long_description': '<div class="jp-info-img"><a href="http:\/\/support.wordpress.com\/contact-form\/"><img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/contactform.jpg" alt="Contact Form" width="300" height="150" \/><\/a><\/div><p>A contact form is a great way to offer your readers the ability to get in touch, without giving out your personal email address.<\/p><p>Each contact form can easily be customized to fit your needs. When a user submits your contact form, the feedback will be filtered through <a href="http:\/\/akismet.com\/">Akismet<\/a> (if it is <a href="https:\/\/testsite.me\/wp-admin\/plugin-install.php?tab=search&s=akismet">active on your site<\/a>) to make sure it\u2019s not spam. Any legitimate feedback will then be emailed to you, and added to your feedback management area.<\/p>',
				'search_terms': 'contact, form, grunion, feedback, submission',
				'configurable': false
			},
			'omnisearch': {
				'name': 'Omnisearch',
				'description': 'Search your entire database from a single field in your Dashboard.',
				'jumpstart_desc': '',
				'sort': 16,
				'recommendation_order': 20,
				'introduced': '2.3',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Developers'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'search',
				'module': 'omnisearch',
				'activated': true,
				'deactivate_nonce': 'e90509504e',
				'activate_nonce': '57292f2e9f',
				'available': true,
				'short_description': 'Search your entire database from a single field in your Dashboard.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=omnisearch',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/omnisearch\/">Learn More<\/a>',
				'long_description': '\n\t<p>Search once, get results from everything! Currently supports searching posts, pages, comments, media, and plugins.<\/p>\n\n\t<p>Omnisearch plays nice with other plugins by letting other providers offer results as well.<\/p>\n\n\t\n',
				'search_terms': 'search',
				'configurable': false
			},
			'widget-visibility': {
				'name': 'Widget Visibility',
				'description': 'Specify which widgets appear on which pages of your site.',
				'jumpstart_desc': '',
				'sort': 17,
				'recommendation_order': 20,
				'introduced': '2.4',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Appearance'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'widget visibility, logic, conditional, widgets, widget',
				'module': 'widget-visibility',
				'activated': true,
				'deactivate_nonce': '9575aa8f3c',
				'activate_nonce': '0477b39127',
				'available': true,
				'short_description': 'Specify which widgets appear on which pages of your site.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=widget-visibility',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/widget-visibility\/">Learn More<\/a>',
				'long_description': '\t<p>Control which pages your widgets appear on with Widget Visibility.<\/p>\n\t<p>To control visibility, expand the widget and click the Visibility button next to the Save button, and then, choose a set of visibility options.<\/p>\n\t<p>For example, if you wanted the Archives widget to only appear on category archives and error pages, choose &quot;Show&quot; from the first dropdown and then add two rules: &quot;Page is 404 Error Page&quot; and &quot;Category is All Category Pages.&quot;<\/p>\n\t<p>You can also hide widgets based on the current page. For example, if you don&#039;t want the Archives widget to appear on search results pages, choose &quot;Hide&quot; and &quot;Page is Search results.&quot;<\/p>\n',
				'search_terms': 'widget visibility, logic, conditional, widgets, widget',
				'configurable': false
			},
			'json-api': {
				'name': 'JSON API',
				'description': 'Allow applications to securely access your content through the cloud.',
				'jumpstart_desc': '',
				'sort': 19,
				'recommendation_order': 20,
				'introduced': '1.9',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'Public',
				'module_tags': [
					'Writing',
					'Developers'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'api, rest, develop, developers, json, klout, oauth',
				'module': 'json-api',
				'activated': true,
				'deactivate_nonce': '80b82b65b1',
				'activate_nonce': '3334eb9f40',
				'available': true,
				'short_description': 'Allow applications to securely access your content through the cloud.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=json-api',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/json-api\/">Learn More<\/a>',
				'long_description': "\t<p>Jetpack will allow you to authorize applications and services to securely connect to your blog and allow them to use your content in new ways and offer you new functionality.\n\t<p>Developers can use WordPress.com's <a href='http:\/\/developer.wordpress.com\/docs\/oauth2\/'>OAuth2<\/a> authentication system and <a href='http:\/\/developer.wordpress.com\/docs\/api\/'>WordPress.com REST API<\/a> to manage and access your site's content.<\/p>\n\n",
				'search_terms': 'api, rest, develop, developers, json, klout, oauth',
				'configurable': false
			},
			'comments': {
				'name': 'Comments',
				'description': 'Let readers comment with WordPress.com, Twitter, Facebook, or Google+ accounts.',
				'jumpstart_desc': '',
				'sort': 20,
				'recommendation_order': 20,
				'introduced': '1.4',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Social'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'comments, comment, facebook, twitter, google+, social',
				'module': 'comments',
				'activated': true,
				'deactivate_nonce': '5ed74d270a',
				'activate_nonce': 'efda5a139b',
				'available': true,
				'short_description': 'Let readers comment with WordPress.com, Twitter, Facebook, or Google+ accounts.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=comments',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': "\t<div class=\"jp-info-img\">\n\t\t<img class=\"jp-info-img\" src=\"https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/comments.jpg\" alt=\"Comments Screenshot\" width=\"300\" height=\"150\" \/>\n\t<\/div>\n\n\t<p>Comments enables your visitors to use their WordPress.com, Twitter, or Facebook accounts when commenting on your site.<\/p>\n\n\t<p>Jetpack tries to match your site's color scheme automatically, but you can make manual adjustments at the bottom of the <a href='https:\/\/testsite.me\/wp-admin\/options-discussion.php#jetpack-comments-settings'>Discussion Settings<\/a> page.<\/p>\n",
				'search_terms': 'comments, comment, facebook, twitter, google+, social',
				'configurable': false
			},
			'minileven': {
				'name': 'Mobile Theme',
				'description': 'Optimize your site with a mobile-friendly theme for smartphones.',
				'jumpstart_desc': '',
				'sort': 21,
				'recommendation_order': 11,
				'introduced': '1.8',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'No',
				'module_tags': [
					'Appearance',
					'Mobile',
					'Recommended'
				],
				'feature': [
					'Recommended'
				],
				'additional_search_queries': 'mobile, theme, minileven',
				'module': 'minileven',
				'activated': true,
				'deactivate_nonce': '10ff5912ff',
				'activate_nonce': '7742380fd4',
				'available': true,
				'short_description': 'Optimize your site with a mobile-friendly theme for smartphones.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=minileven',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/mobile-theme.jpg" alt="Mobile Theme" width="300" height="150" \/>\n\t<\/div>\n\n\t<p>There&#039;s a good chance that visitors to your site will be using a smartphone, and it&#039;s important to provide them with a great reading experience while on the small screen.<\/p>\n\t<p>Jetpack&#039;s mobile theme is optimized for small screens. It uses the header image, background, and widgets from your current theme for a great custom look. Post format support is included, so your photos and galleries will look fantastic on a smartphone.<\/p>\n\t<p>Visitors on iPhone, Android, Windows Phone, and other mobile devices will automatically see the mobile theme, with the option to view the full site. You can enable or disable the mobile theme by clicking the &quot;Activate&quot; or &quot;Deactive&quot; button above.<\/p>\n',
				'search_terms': 'mobile, theme, minileven',
				'configurable': false
			},
			'carousel': {
				'name': 'Carousel',
				'description': 'Transform standard image galleries into full-screen slideshows.',
				'jumpstart_desc': 'Brings your photos and images to life as full-size, easily navigable galleries.',
				'sort': 22,
				'recommendation_order': 12,
				'introduced': '1.5',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'No',
				'module_tags': [
					'Photos and Videos'
				],
				'feature': [
					'Jumpstart'
				],
				'additional_search_queries': 'gallery, carousel, diaporama, slideshow, images, lightbox, exif, metadata, image',
				'module': 'carousel',
				'activated': true,
				'deactivate_nonce': '763545afaf',
				'activate_nonce': '041616a8c3',
				'available': true,
				'short_description': 'Transform standard image galleries into full-screen slideshows.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=carousel',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': '\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/carousel.jpg" alt="Gallery Carousel Screenshot" width="300" height="188" \/>\n\t<\/div>\n\n\t<p>With Carousel active, any standard WordPress galleries you have embedded in posts or pages will launch a gorgeous full-screen photo browsing experience with comments and EXIF metadata.<\/p>\n',
				'search_terms': 'gallery, carousel, diaporama, slideshow, images, lightbox, exif, metadata, image',
				'configurable': false
			},
			'site-icon': {
				'name': 'Site Icon',
				'description': 'Add a site icon to your site.',
				'jumpstart_desc': '',
				'sort': 22,
				'recommendation_order': 20,
				'introduced': '3.2',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'No',
				'module_tags': [
					'Other'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'favicon, icon, site icon',
				'module': 'site-icon',
				'activated': false,
				'deactivate_nonce': 'a2ae8bd090',
				'activate_nonce': '4124a37eb7',
				'available': true,
				'short_description': 'Add a site icon to your site.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=site-icon',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/site-icon">Learn More<\/a>',
				'long_description': '\n\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/site-icon.png" alt="Site Icon" width="300" height="150" \/>\n\t<\/div>\n\n\t<p>Site Icon lets you create an icon for your site. This icon will be used as favicon, mobile icon, and Tile on Windows 8 computers.<\/p>\n\t<p>To add a new icon to your site, head over to <a href="https:\/\/testsite.me\/wp-admin\/options-general.php#site-icon">Settings &rarr; General &rarr; Site Icon<\/a>, and upload an icon.<\/p>\n\n',
				'search_terms': 'favicon, icon, site icon',
				'configurable': false
			},
			'likes': {
				'name': 'Likes',
				'description': 'Give visitors an easy way to show their appreciation for your content.',
				'jumpstart_desc': '',
				'sort': 23,
				'recommendation_order': 20,
				'introduced': '2.2',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Social'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'like, likes, wordpress.com',
				'module': 'likes',
				'activated': true,
				'deactivate_nonce': 'a136c933d5',
				'activate_nonce': '6561a70e88',
				'available': true,
				'short_description': 'Give visitors an easy way to show their appreciation for your content.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=likes',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': '\n\t<div class="jp-info-img">\n\t\t<a href="http:\/\/jetpack.me\/support\/likes\/">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/likes.jpg" alt="Likes" width="323" height="69" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p>Likes allow your readers to show their appreciation for your posts and other published content using their WordPress.com accounts. Your readers will then be able to review their liked posts from WordPress.com.<\/p>\n\t<p>Displayed below your posts will be how many people have liked your posts and the Gravatars of those who have liked them.<\/p>\n\t\t<p>&rarr; <a href="http:\/\/jetpack.me\/support\/likes\/">More information on using Likes.<\/a><\/p>\n\n',
				'search_terms': 'like, likes, wordpress.com',
				'configurable': false
			},
			'tiled-gallery': {
				'name': 'Tiled Galleries',
				'description': 'Display your image galleries in a variety of sleek, graphic arrangements.',
				'jumpstart_desc': '',
				'sort': 24,
				'recommendation_order': 20,
				'introduced': '2.1',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'No',
				'module_tags': [
					'Photos and Videos'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'gallery, tiles, tiled, grid, mosaic, images',
				'module': 'tiled-gallery',
				'activated': true,
				'deactivate_nonce': '985c9a93f7',
				'activate_nonce': '62e1995276',
				'available': true,
				'short_description': 'Display your image galleries in a variety of sleek, graphic arrangements.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=tiled-gallery',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': "\t<div class=\"jp-info-img\">\n\t\t<img class=\"jp-info-img\" src=\"https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/tiled-gallery.jpg\" alt=\"Tiled Galleries\" width=\"300\" height=\"150\" \/>\n\t<\/div>\n\n\t<p>Create elegant magazine-style mosaic layouts for your photos without having to use an external graphic editor.<\/p>\n\t<p>When adding a gallery to your post, you now have the option to select a layout style for your images. We've added support for Rectangular, Square, and Circular galleries. By default, galleries will continue to display using the standard thumbnail grid layout. To make the rectangular layout the default for all of your site's galleries, head over to <a href=\"https:\/\/testsite.me\/wp-admin\/options-media.php\">Settings &rarr; Media<\/a> and check the box next to \"Display all your gallery pictures in a cool mosaic.\"<\/p>\n\t<p><em>Note: Images in tiled galleries require extra-special processing, so they will be served from WordPress.com&#039;s CDN even if the Photon module is disabled.<\/em><\/p>\n",
				'search_terms': 'gallery, tiles, tiled, grid, mosaic, images',
				'configurable': false
			},
			'photon': {
				'name': 'Photon',
				'description': 'Speed up images and photos.',
				'jumpstart_desc': 'Mirrors and serves your images from our free and fast image CDN, improving your site\u2019s performance with no additional load on your servers.',
				'sort': 25,
				'recommendation_order': 1,
				'introduced': '2.0',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Photos and Videos',
					'Appearance',
					'Recommended'
				],
				'feature': [
					'Recommended',
					'Jumpstart',
					'Performance-Security'
				],
				'additional_search_queries': 'photon, image, cdn, performance, speed',
				'module': 'photon',
				'activated': false,
				'deactivate_nonce': '6462c26be1',
				'activate_nonce': '0b225202fa',
				'available': true,
				'short_description': 'Speed up images and photos.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=photon',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': '\t<p>Give your site a boost by loading images in posts from the WordPress.com content delivery network. We cache your images and serve them from our super-fast network, reducing the burden on your Web host with the click of a button.<\/p>\n',
				'search_terms': 'photon, image, cdn, performance, speed',
				'configurable': false
			},
			'infinite-scroll': {
				'name': 'Infinite Scroll',
				'description': 'Add support for infinite scroll to your theme.',
				'jumpstart_desc': '',
				'sort': 26,
				'recommendation_order': 20,
				'introduced': '2.0',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'No',
				'module_tags': [
					'Appearance'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'scroll, infinite, infinite scroll',
				'module': 'infinite-scroll',
				'activated': true,
				'deactivate_nonce': '0ff5f632e0',
				'activate_nonce': '33077efc7b',
				'available': true,
				'short_description': 'Add support for infinite scroll to your theme.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=infinite-scroll',
				'learn_more_button': '<a class="button more-info-link" href="#">Learn More<\/a>',
				'long_description': '\n\t\t\t<p>When you write great content, all you really want is people to find it, right?<\/p>\n\n\t\t<p>With the Infinite Scroll module and a supported theme, that&#039;s exactly what happens. Instead of the old way of navigating down a page by scrolling and then clicking a link to get to the next page, waiting for a page refresh&mdash;the document model of the web&mdash;infinite scrolling pulls the next set of posts automatically into view when the reader approaches the bottom of the page, more like an application.<\/p>\n\n\t',
				'search_terms': 'scroll, infinite, infinite scroll',
				'configurable': false
			},
			'videopress': {
				'name': 'VideoPress',
				'description': 'Upload and embed videos right on your site. (Subscription required.)',
				'jumpstart_desc': '',
				'sort': 27,
				'recommendation_order': 20,
				'introduced': '2.5',
				'changed': '',
				'deactivate': true,
				'free': false,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Photos and Videos'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'video, videos, videopress',
				'module': 'videopress',
				'activated': true,
				'deactivate_nonce': '218ef310c1',
				'activate_nonce': '42d5eb683d',
				'available': true,
				'short_description': 'Upload and embed videos right on your site. (Subscription required.)',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=videopress',
				'learn_more_button': '<a class="button-secondary more-info-link" href="#">Learn More<\/a>',
				'long_description': '\t<p>With the VideoPress module you can easily upload videos to your WordPress site and embed them in your posts and pages. This module requires a WordPress.com account with an active <a href="http:\/\/store.wordpress.com\/premium-upgrades\/videopress\/" target="_blank">VideoPress subscription<\/a>. Once you have purchased a VideoPress subscription, <a href="https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=videopress">click here to configure VideoPress<\/a>.<\/p>\n',
				'search_terms': 'video, videos, videopress',
				'configurable': false
			},
			'monitor': {
				'name': 'Monitor',
				'description': 'Reports on site downtime.',
				'jumpstart_desc': '',
				'sort': 28,
				'recommendation_order': 10,
				'introduced': '2.6',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Recommended'
				],
				'feature': [
					'Recommended',
					'Performance-Security'
				],
				'additional_search_queries': 'monitor, uptime, downtime, monitoring',
				'module': 'monitor',
				'activated': true,
				'deactivate_nonce': '4a000a99cf',
				'activate_nonce': 'da2081dc68',
				'available': true,
				'short_description': 'Reports on site downtime.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=monitor',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/monitor\/">Learn More<\/a>',
				'long_description': '\n\t<p>Nobody likes downtime, and that&#039;s why Jetpack Monitor is on the job, keeping tabs on your site by checking it every five minutes. As soon as any downtime is detected, you will receive an email notification alerting you to the issue. That way you can act quickly, to get your site back online again!\n\t<p>We\u2019ll also let you know as soon as your site is up and running, so you can keep an eye on total downtime.<\/p>\n\n',
				'search_terms': 'monitor, uptime, downtime, monitoring',
				'configurable': false
			},
			'related-posts': {
				'name': 'Related Posts',
				'description': 'Display similar content.',
				'jumpstart_desc': 'Keep visitors engaged on your blog by highlighting relevant and new content at the bottom of each published post.',
				'sort': 29,
				'recommendation_order': 9,
				'introduced': '2.9',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Recommended'
				],
				'feature': [
					'Recommended',
					'Jumpstart',
					'Traffic'
				],
				'additional_search_queries': 'related, related posts',
				'module': 'related-posts',
				'activated': true,
				'deactivate_nonce': '06c3074a07',
				'activate_nonce': '7d7a2f6427',
				'available': true,
				'short_description': 'Display similar content.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=related-posts',
				'learn_more_button': '<a class="button more-info-link" href="#">Learn More<\/a>',
				'long_description': '\t\t<div class="jp-info-img">\n\t\t\t<a href="http:\/\/jetpack.me\/support\/related-posts\/">\n\t\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/related-posts.jpg" alt="Related Posts" width="300" height="98" \/>\n\t\t\t<\/a>\n\t\t<\/div>\n\n\t\t<p>&quot;Related Posts&quot; shows additional relevant links from your site under your posts. If the feature is enabled, links appear underneath your Sharing Buttons and WordPress.com Likes (if you\u2019ve turned these on).<\/p>\n\t\t<p>&rarr; <a href="http:\/\/jetpack.me\/support\/related-posts\/">More information on using Related Posts.<\/a><\/p>\n\t\t<hr \/>\n\t\t<p><a href="https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack-debugger#sync-related-posts">This feature uses the WordPress.com infrastructure and requires that your public content be mirrored there. If you see intermittent issues only affecting certain posts, request a reindex of your posts.<\/a><\/p>',
				'search_terms': 'related, related posts',
				'configurable': false
			},
			'sso': {
				'name': 'Single Sign On',
				'description': 'Secure user authentication.',
				'jumpstart_desc': 'Lets you log in to all your Jetpack-enabled sites with one click using your WordPress.com account.',
				'sort': 30,
				'recommendation_order': 5,
				'introduced': '2.6',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': true,
				'auto_activate': 'No',
				'module_tags': [
					'Developers'
				],
				'feature': [
					'Jumpstart',
					'Performance-Security'
				],
				'additional_search_queries': 'sso, single sign on, login, log in',
				'module': 'sso',
				'activated': true,
				'deactivate_nonce': 'd2d9b30569',
				'activate_nonce': '63efc878ec',
				'available': true,
				'short_description': 'Secure user authentication.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=sso',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/jetpack.me\/support\/sso\/">Learn More<\/a>',
				'long_description': '\n\t<p>With Single Sign On, your users will be able to log in to or register for your WordPress site with the same credentials they use on WordPress.com.  It&#039;s safe and secure.<\/p>\n\t<p>Once enabled, a &quot;Log in with WordPress.com&quot; option will be added to your existing log in form.<\/p>\n\n',
				'search_terms': 'sso, single sign on, login, log in',
				'configurable': false
			},
			'markdown': {
				'name': 'Markdown',
				'description': 'Write posts or pages in plain-text Markdown syntax.',
				'jumpstart_desc': '',
				'sort': 31,
				'recommendation_order': 20,
				'introduced': '2.8',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'No',
				'module_tags': [
					'Writing'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'md, markdown',
				'module': 'markdown',
				'activated': true,
				'deactivate_nonce': '59923ed334',
				'activate_nonce': '89f8765fc8',
				'available': true,
				'short_description': 'Write posts or pages in plain-text Markdown syntax.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=markdown',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/en.support.wordpress.com\/markdown\/">Learn More<\/a>',
				'long_description': '\t<p>Markdown lets you compose posts and comments with links, lists, and other styles using regular characters and punctuation marks. Markdown is used by writers and bloggers who want a quick and easy way to write rich text, without having to take their hands off the keyboard, and without learning a lot of complicated codes and shortcuts.<\/p>\n\n',
				'search_terms': 'md, markdown',
				'configurable': false
			},
			'vaultpress': {
				'name': 'Data Backups',
				'description': 'Daily or real-time backups.',
				'jumpstart_desc': '',
				'sort': 32,
				'recommendation_order': 20,
				'introduced': '0:1.2',
				'changed': '',
				'deactivate': false,
				'free': false,
				'requires_connection': true,
				'auto_activate': 'Yes',
				'module_tags': [
					'Other'
				],
				'feature': [
					'Performance-Security'
				],
				'additional_search_queries': 'vaultpress, backup, security',
				'module': 'vaultpress',
				'activated': false,
				'deactivate_nonce': 'e64f8a1ca9',
				'activate_nonce': 'd5c7d198b2',
				'available': false,
				'short_description': 'Daily or real-time backups.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=vaultpress',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/vaultpress.com\/jetpack\/">Learn More<\/a>',
				'long_description': '\n\t<div class="jp-info-img">\n\t\t<a href="http:\/\/vaultpress.com\/jetpack\/">\n\t\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/vaultpress.jpg" alt="VaultPress" width="300" height="150" \/>\n\t\t<\/a>\n\t<\/div>\n\n\t<p>With a monthly subscription, the VaultPress plugin will backup your site&#8217;s content, themes, and plugins in real-time, as well as perform regular security scans for common threats and attacks.<\/p>\n\t<p>View <a href="http:\/\/vaultpress.com\/jetpack\/">Plans &amp; Pricing<\/a>.<\/a><\/p>\n',
				'search_terms': 'vaultpress, backup, security',
				'configurable': false
			},
			'verification-tools': {
				'name': 'Site Verification',
				'description': 'Verify your site or domain with Google Search Console, Pinterest, and others.',
				'jumpstart_desc': '',
				'sort': 33,
				'recommendation_order': 20,
				'introduced': '3.0',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Other'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'webmaster, seo, google, bing, pinterest, search, console',
				'module': 'verification-tools',
				'activated': true,
				'deactivate_nonce': '35ee1b1267',
				'activate_nonce': '2580aff74c',
				'available': true,
				'short_description': 'Verify your site or domain with Google Search Console, Pinterest, and others.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=verification-tools',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/support.wordpress.com\/webmaster-tools\/">Learn More<\/a>',
				'long_description': "\t<p>Use these tools to verify that you own\/control your website with other external services like Google, Bing and Pinterest.<\/p>\n\t<p>Verifying your site allows you to access advanced features on these other services (e.g. Webmaster tools, Google Search Console, or getting a verified badge). We'll just add an invisible <code>meta<\/code> tag to the source code of your homepage.<\/p>\n",
				'search_terms': 'webmaster, seo, google, bing, pinterest, search, console',
				'configurable': false
			},
			'custom-content-types': {
				'name': 'Custom Content Types',
				'description': 'Organize and display different types of content on your site, separate from posts and pages.',
				'jumpstart_desc': '',
				'sort': 34,
				'recommendation_order': 20,
				'introduced': '3.1',
				'changed': '',
				'deactivate': true,
				'free': true,
				'requires_connection': false,
				'auto_activate': 'Yes',
				'module_tags': [
					'Writing'
				],
				'feature': [
					'Other'
				],
				'additional_search_queries': 'cpt, custom post types, portfolio, portfolios, testimonial, testimonials',
				'module': 'custom-content-types',
				'activated': true,
				'deactivate_nonce': '9b0016bce6',
				'activate_nonce': 'ee0bfbf3a1',
				'available': true,
				'short_description': 'Organize and display different types of content on your site, separate from posts and pages.',
				'configure_url': 'https:\/\/testsite.me\/wp-admin\/admin.php?page=jetpack&configure=custom-content-types',
				'learn_more_button': '<a class="button-secondary more-info-link" href="http:\/\/support.wordpress.com\/portfolios\/">Learn More<\/a>',
				'long_description': '\n\t<div class="jp-info-img">\n\t\t<img class="jp-info-img" src="https:\/\/testsite.me\/wp-content\/plugins\/jetpack\/images\/screenshots\/custom-content-types.jpg" alt="Custom Content Type" width="300" height="150" \/>\n\t<\/div>\n\n\t<p>Organize and display different types of content on your site, such as Portfolio Projects and Testimonials. These content types are separate from Posts and Pages.<\/p>\n\n\t\n\t\t<p>To enable a custom content type, head over to <a href="https:\/\/testsite.me\/wp-admin\/options-writing.php#cpt-options">Settings &rarr; Writing &rarr; Your Custom Content Types<\/a> and activate either "Portfolio Projects\u201d or \u201cTestimonials\u201d by checking the corresponding checkbox. You can now add projects and testimonials under the new "Portfolio\u201d and \u201cTestimonials\u201d menu items in your sidebar.<\/p>\n\n\t\t<p>Once added, your custom content will be visible on your website at <a href="https:\/\/testsite.me\/portfolio\/">https:\/\/testsite.me\/portfolio\/<\/a> or <a href="https:\/\/testsite.me\/testimonial\/">https:\/\/testsite.me\/testimonial\/<\/a>, or you may add them with <a href="http:\/\/jetpack.me\/support\/custom-content-types\/" target="_blank">shortcodes<\/a>.<\/p>\n\n\t',
				'search_terms': 'cpt, custom post types, portfolio, portfolios, testimonial, testimonials',
				'configurable': false
			}
		}
	}
}