## 6.6

### Shortcodes

#### MailChimp

Mailchimp updated their newsletter embed code, and the old one does not work anymore.

To test the changes, try the following:

- As an admin, add the new embed code to a new post.
- As a contributor, add the new embed code to a new post and save your draft. Watch the code convert into a shortcode.
- Make sure the newsletter pop up appears on your site when you view the post.
- Make sure no JavaScript errors appear in your browser console.

Here is an example embed code you can add to your post:

```html
<script type="text/javascript" src="//downloads.mailchimp.com/js/signup-forms/popup/unique-methods/embed.js" data-dojo-config="usePlainJson: true, isDebug: false"></script><script type="text/javascript">window.dojoRequire(["mojo/signup-forms/Loader"], function(L) { L.start({"baseUrl":"mc.us8.list-manage.com","uuid":"be06c2a596db91bfe4099fde8","lid":"08cf5fa008","uniqueMethods":true}) })</script>
```

**Thank you for all your help!**
