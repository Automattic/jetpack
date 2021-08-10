# Local environment with Docker

You can have a complete running local WordPress environment with the plugin activated running inside docker containers
using the following command:

```
npm run dev:start
```

This command will
- Pull the latest Docker images used in the environment. This might take a while on the first setup and when the images change.
- Start the Docker containers
- Activate WordPress
- Activate the Jetpack Boost plugin and the Jetpack Boost Development Sidekick Plugin

The local site will be available at [http://localhost:9001](http://localhost:9001)

The credentials for logging as an admin are:

```
Username: admin
Password: jetpackboostpassword
```

You can stop the local Docker environment using the following command:

```
npm run dev:stop
```

## Setting up the Jetpack Connection
Note that on the very first install, when heading to the admin section of the Jetpack Boost plugin, the
first screen show will be the Jetpack connection screen.
However, because the local environment runs under localhost the Jetpack connection does not work.

There are 2 options available to make it work.

### Create a public URL for your localhost

You can use a software such as [ngrok](https://ngrok.com/) to create a public URL for your localhost.

The command for ngrok without a custom domain will be `ngrok http 9001`

Then you'll have to update the WordPress site urls inside the `Settings -> General` admin section to the
public url created by `ngrok` or the equivalent.

### Bypass the Jetpack connection and fake out the connected Jetpack user

 You can add the following code into a custom plugin or inside the Jetpack Boost Development/Test Sidekick Plugin to
 bypass the Jetpack Connection:

```php
// bypass the Jetpack connection - act like you're already connected
add_filter( 'jetpack_boost_connection_bypass', '__return_true' );

// fake out connected Jetpack user on WPCOM
add_filter(
	'jetpack_boost_connection_user_data',
	function ( $user ) {
		$wpcomUser = array(
			'ID' => 1234,
			'login' => 'fakewpcomuser',
			'email' => 'fakewpcomuser@example.com',
			'display_name' => 'Fake WPCOM User',
			'text_direction' => 'ltr',
			'site_count' => 1,
			'jetpack_connect' => 1,
			'avatar' => 'http://example.com/avatar.png',
		);

		return [
			'wpcomUser' => $wpcomUser,
			'isPrimaryUser' => false,
			'canDisconnect' => false,
		];
	}
);
```

## Accessing WordPress Core file and wp-content

You can find the WordPress core files as well as the `wp-content` folder under the `docker/boost-dev/wordpress` directory.

