=== Sharedaddy ===
Contributors: eoigal, johnny5, donncha, polldaddy, automattic
Tags: share, sharing, email, twitter, facebook, print, reddit, stumbleupon, digg
Requires at least: 3.0
Tested up to: 3.1
Stable tag: trunk

Share your posts with Twitter, Facebook, and a host of other services

== Description ==

Share your posts with Twitter, Facebook, and a host of other services. You can configure services to appear as icons, text, or both. Some services have additional options to display smart buttons, such as Twitter, which will update the number of times the post has been shared.

The following services are included:

* Twitter
* Facebook
* Reddit
* StumbleUpon
* PressThis
* Digg
* Print
* Email
 
Additionally you can define your own custom services.

[wpvideo WV0JOwY2]

The plugin is available in the following languages:

* English
* Japanese, thanks to Naoko McCracken
* Portuguese, thanks to WordPress Portugal
* Spanish, thanks to elarequi
* German, thanks to Jott und die Welt
* French, thanks to Dario Spagnolo / Aurélie Rochelle
* Brazilian Portuguese, thanks to Gabriel Reguly
* Dutch, thanks to Chantal Coolsma
* Serbian, thanks to Milan Dinić

If you have a translation please send it us and we would be glad to include it for everyone to use!

The following plugins extend Sharedaddy:

* [Mixi Check](http://wordpress.org/extend/plugins/mixi-check/) - support for Mixi

For more detailed information about using this plugin you can refer to these pages:

* http://support.wordpress.com/sharing/
* http://ryanmarkel.com/2010/08/26/adding-a-custom-sharing-service-to-wordpress-com/
* http://ryanmarkel.com/2010/08/31/adding-specific-sharing-services-to-sharedaddy/
* http://wpgarage.com/tips/how-to-add-a-linkedin-share-button-to-sharedaddy/

Note: You will need PHP5 to use this plugin

== Installation ==

Upload the plugin to your blog and activate it. Configure your sharing services from the Settings > Sharing dashboard page

== Screenshots ==

1. Manage sharing services
2. Share posts

== Changelog ==
= 0.1 =
* Initial release

= 0.2 =
* Fix incorrect link in plugin page
* Remove debug from JS code

= 0.2.1 =
* Add Japanese translation, thanks Naoko!

= 0.2.2 =
* Add Portuguese translation, thanks WordPress Portugal!

= 0.2.3 =
* Add Spanish, thanks to elarequi!

= 0.2.4 =
* Fix incorrect icon reference

= 0.2.5 =
* Add German, thanks to Jott und die Welt!
* Optimize loading of Digg JS

= 0.2.6 =
* Add French, thanks to Dario Spagnolo / Aurélie Rochelle!

= 0.2.7 =
* Add Brazilian Portuguese, thanks to Gabriel
* Add Dutch, thanks to Chantal

= 0.2.8 =
* Update Spanish translation (thanks to elarequi)
* Change CSS link to use wp_enqueue (props to Barry)
* Add %post_full_url% to custom service tags
* Fixed removal of sharing option in quickedit (props to dimadin)
* Add service ID to sharing_permalink filter (props to dimadin)
* Email service loading.gif is included in the plugin
* Better RTL support, cleanup style issues in some themes (props to Lance)

= 0.2.9 =
* Add Serbian translation (thanks to Milan Dinić)
* Fix double = in Facebook share and rawurlencode like button for better theme compat (props to Lance)
* Add %post_tags% to custom service tags
* Allow Facebook like button width to change
* Language domain fixes (props to dimadin)
* Add language context to service names
* Add 'sharing_show' filter to allow custom determination of whether to show sharing links
* Add option to disable CSS and JS (so it can be moved in theme, if required)
* Better support for non-multibyte blogs

= 0.2.10 =
* Restore fixes to Twitter link

= 0.2.11 =
* Updated German language (thanks to infected)
* Further improvements to localisation (thanks to Milan Dinić)

= 0.2.12 =
* Theme placement improvements
* Add Danish width to Facebook
* Fix invalid HTML in Twitter iframe
