# Developing Gutenberg Blocks for Jetpack

_Note: Since the Gutenberg SDK is still being actively developed, the development workflow described here is subject to frequent change (as of October 2018). Notably, we're currently working on a different (lerna and npm based) deploy workflow. Be sure to check back frequently!_

1.  Install & activate the [Gutenberg plugin](https://wordpress.org/plugins/gutenberg/).

    If you use Jetpack-Docker, you can use WP-CLI:
	
    ```bash
    yarn docker:wp plugin install gutenberg --activate
    ```

1.  In Jetpack, enable loading local block assets by adding following filter to your local mu-plugins folder:

    ```php
    add_filter( 'jetpack_gutenberg_cdn', '__return_false', 10 );
    ```

    If you use Jetpack-Docker, you could add these to `docker/mu-plugins/0-custom.php`

    Setting these might be useful for debugging:

    ```php
    define( 'SCRIPT_DEBUG', true );
    define( 'GUTENBERG_DEVELOPMENT_MODE', true );
    ```

    If you use Jetpack-Docker, you could add these to `docker/wordpress/wp-config.php`

    Those filters take action here: https://github.com/Automattic/jetpack/blob/b4a057fad975f3db8097fd62e702e276fd3d4389/class.jetpack.php#L7272-L7381

1.  Jetpack will now load these files when editing posts in Gutenberg:

    ```
    _inc/blocks/editor.css
    _inc/blocks/editor.rtl.css
    _inc/blocks/editor.js
    _inc/blocks/view.css
    _inc/blocks/view.rtl.css
    _inc/blocks/view.js
    ```

    Without setting `jetpack_gutenberg_cdn` to false, Jetpack would load these assets from CDN with 24h cache buster:

    https://s0.wp.com/wp-content/mu-plugins/jetpack/_inc/blocks/

    This is great for letting team-outsiders test our current set of Jetpack blocks; let's deploy these when ever we have something to show.

    Use the helper script introduced in D18479-code to produce these assets locally for your sandbox so that you can then commit and deploy.

    Note that we currently have a fixed list of dependencies which is just everything current trial blocks depend on: https://github.com/Automattic/jetpack/blob/b4a057fad975f3db8097fd62e702e276fd3d4389/class.jetpack.php#L7355-L7366

    We don't have a mechanism in SDK to export these during compile time.

1.  (optional) To run SDK CLI commands from anywhere in file system, type `npm link` in Calypso folder. You now have `calypso-sdk` command available.

1.  The source for Jetpack blocks lives in the Calypso repository: https://github.com/Automattic/wp-calypso/tree/96b2d6a64f3d65fbadfbbf707d0d1cdaa23b942f/client/gutenberg/extensions

    Bundled Jetpack blocks should be added to the corresponding [`jetpack` presets](https://github.com/Automattic/wp-calypso/tree/master/client/gutenberg/extensions/presets/jetpack).

    The SDK supports building code from external sources so you don't necessarily have to commit to Calypso until to the point you want to share your work.

1.  With all this said and set up — to build a block and develop it with Jetpack, run:

    ```bash
    npm run sdk -- gutenberg \
    client/gutenberg/extensions/hello-dolly/ \
    --output-dir=~/path/to/jetpack/_inc/blocks \
    --watch
    ```

    If you linked Calypso earlier, instead of `npm run sdk -- gutenberg` you can run `calypso-sdk gutenberg`.

    If you then run that command from Jetpack folder, you can then simply do this with the output-dir:  `--output-dir=./_inc/blocks`

1. If the block you’re building requires Jetpack to be connected, you can use ngrok to open a public tunnel to your local development environment. For installation, refer to the Field Guide; running it is as simple as:

    ```bash
    ngrok http 80
    ```

    Refer to [using ngrok with Jetpack](https://github.com/Automattic/jetpack/tree/master/docker#using-ngrok-with-jetpack) for more usage information.

    Using the free version, this will provide you with a unique URL that you can use for the next 8 hours. With the free version, every time you get a new URL you will need to reconnect Jetpack.

    If you use the paid version, this will allow you to have your own URL that you can use consistently, without having to reconnect.

## Other Resources

- SDK documentation: https://wpcalypso.wordpress.com/devdocs/docs/sdk.md
- Jetpack Docker documentation: https://github.com/Automattic/jetpack/tree/master/docker#readme