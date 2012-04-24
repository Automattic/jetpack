=== Grunion Contact Form ===
Contributors: mdawaffe, automattic, nickmomrik
Tags: WordPress.com, contact form, email
Stable tag: 2.3
Requires at least: 3.0
Tested up to: 3.3

Add a contact form to any post, page or text widget. Messages will be sent to any email address you choose. As seen on WordPress.com.

== Description ==

Add a contact form to any post or page by inserting `[contact-form]` in the post.  Messages will be sent to the post's author or any email address you choose.

Or add a contact form ta a text widget.  Messages will be sent to the email address set in your Settings -> General admin panel or any email address you choose.

Your email address is never shown, and the sender never learns it (unless you reply to the email).

As seen on WordPress.com.

= Configuration =

The `[contact-form]` shortcode has the following parameters:

* `to`: A comma separated list of email addresses to which the messages will be sent.
  If you leave this blank: contact forms in posts and pages will send messages to the post or page's author; and
  contact forms in text widgets will send messages to the email address set in Settings -> General.

  Example: `[contact-form to="you@me.com"]`

  Example: `[contact-form to="you@me.com,me@you.com,us@them.com"]`

* `subject`: The e-mail subject of the message defaults to `[{Blog Title}] {Sidebar}` for text widgets
  and `[{Blog Title}] {Post Title}` for posts and pages. Set your own default with the subject option.

  Example: `[contact-form subject="My Contact Form"]`

* `show_subject`: You can allow the user to edit the subject by showing a new field on the form. The
  field will be populated with the default subject or the subject you have set with the previous option.

  Example: `[contact-form subject="My Contact Form" show_subject="yes"]`

== Frequently Asked Questions ==

= What's a Grunion? =

The plugin was written in Southern California, home of an unusual fish call the [Grunion](http://en.wikipedia.org/wiki/Grunion).
There's no correlation between fish and contact forms as far as I can tell; it's just a fun sounding word that's geographically apropos.

= What about spam? Will I get a lot from the contact form? =

If you have [Akismet](http://akismet.com/) installed on your blog, you shouldn't get much spam.
All the messages people send to you through the contact form will be filtered through Akismet.

= Anyone can put whatever they want in the name and email boxes. How can I know who's really sending the message? =

If a logged member of your site sends you a message, the end of the email will let you know that the message was sent by a verified user.
Otherwise, you can't trust anything... just like a blog comment.

Anonymity is both a curse and a blessing :)

= My blog has multiple authors. Who gets the email? =

By default, the email is sent to the author of the post with the contact form in it. So each author on your blog can have his or her own contact form.

In the contact form shortcode, you can specify what email address(es) messages should be sent to with the `to` parameter.

= Great! But how will my visitors know who they're sending a message to? =

Just make the title of your post "Contact Mary" or put "Hey, drop John a line with the form below" in the body of your post.

== Changelog ==

= 2.4 =
* Support forms with no email address
* Don't include *** SPAM *** in the subject line of unspammed items
* Fix form processing when there is more than one form on a page (Koff)

= 2.3 =
* Fix for Chrome going 'oh snap' when inserting a new contact form
* Fix for export/import issue that created users incorrectly
* Add 'grunion_pre_message_sent' action (dimadin)
* Updates to work with WordPress 3.3+ changes to wp-admin UI

= 2.2 =
* Only load grunion.css on pages with a contact form
* Be better about checking for valid email addresses
* Track the permalink for the contact form that was used and provide that detail in the email and Feedbacks page
* Fix for the problem where every feedback would be marked as spam if the Akismet plugin wasn't activated
* Make sure wp_kses only gets used on strings
* New filter: grunion_still_email_spam, for those that want to still gets emails even when a feedback has been flagged as spam

= 2.1 =
* Fix error where the form builder wouldn't load correctly when using mapped domains
* Don't attempt to check form submission for spam unless the Akismet plugin is active
* Fixed form styles so that they wouldn't affect forms outside grunion container
* Fixed "Add form to post" button in IE7
* Fixed "re-arrange" in drag and drop so that it doesn't hard return
* Hid "re-arrange" once you start dragging
* Fixed issue where if you had content in the post, and added a form the content disappeared
* Fixed form field width for when form is in the sidebar
* Fixed First textarea label is always missing in email
* Fixed Name, Email, Web site are always shown in default labels
* Fixed Result page only shows the first textarea message
* Fixed Results missing in the email notification
* Limit form field submissions to valid text
* Fixed broken path to button-grad-active.png
* Encode drop down options so that quotes and commas work correctly
* Encode quotes in field labels so that they show up correctly
* Fix the from address formatting in the email headers
* Use the correct bulk action filter to limit the list to supported actions only
* Removed inline styles
* Moved basic form CSS to include
* Changed HTML shortcode insert from .html() to .val()
* Fixed HTML encoding of option values for select fields

= 1.2 =
* Fix a PHP Warning in some CGI evironments.

= 1.1 =
* Move to shortcode API.
* Add `to`, `subject` and `show-subject` options.
* Allow use in text widgets.
* Move spam check to a filter.

== Upgrade Notice ==

= 1.2 =
Fixes a PHP Warning.

= 1.1 =
Now with more options!
