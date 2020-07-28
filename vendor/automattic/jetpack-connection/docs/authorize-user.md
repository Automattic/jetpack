# Authorize the user

After you have [registered your site](register-site.md), you can give
your users a way to connect their account to a WordPress.com account,
just as you would when using Jetpack.

The regular connection process is to send the user to a specific URL
where they would log in, and give consent to WordPress.com to access
their self-hosted site's data. To give a user of your site a way to do
that you can add a button to your admin area:

```php
use Automattic\Jetpack\Connection\Manager;

// Getting the existing blog token created at registration step.
$manager = new Manager( 'plugin-slug' );
$blog_token = $manager->get_access_token();
$user_token = $manager->get_access_token( get_current_user_id() );
$auth_url   = $manager->get_authorization_url();

// Checking if the user is already connected. If not, the token will
// be empty.
if ( $user_token ) : ?>
	<p>Awesome! You are connected as an authenticated user!</p>
<?php else: ?>
	<form action="/wp-admin/admin-post.php" method="post">
		<input type="hidden" name="action" value="connect_user">
		<?php wp_nonce_field( 'connect-user' ); ?>
		<input type="submit" value="Connect current user" class="button button-primary">
	</form>
<?php endif; ?>
```

As with the registration step, you need to add a WordPress POST
handler, as one usually does for admin actions:

```php
use Automattic\Jetpack\Connection\Manager;

add_action( 'admin_post_connect_user', 'your_plugin_connect_user' ) );

function your_plugin_register_site() {
	check_admin_referer( 'connect-user' );
	( new Manager( 'plugin-slug' ) )->connect_user();
}
```

After the connection process is done, the user should have the user
token added to the options, and you will be able to retrieve it with a
`get_access_token` call.
