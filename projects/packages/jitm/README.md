# Jetpack Just In Time Messages

A package encapsulating Just In Time Messages.

Just In Time Messages (JITMs) are real-time contextual in-admin notices. Such notices are displayed on specific admin pages, based on multiple parameters (page visited, Jetpack connection status, plan status, features active, ...).

There are 2 main ways to use JITMs:

- You can create static notices within the Jetpack plugin. Those will be displayed before the site is connected to WordPress.com. See `Pre_Connection_JITM` to find out more.
- You can create dynamic notices once the Jetpack plugin is connected to WordPress.com. Those notices will be pulled from WordPress.com depending on the parameters mentioned above. See `Post_Connection_JITM` to find out more.

### Usage

#### Using the Config Package

The JITMs can be enabled using the Config package:

```
use Automattic/Jetpack/Config;

// Configuring as early as plugins_loaded priority 1
// to make sure every action handler gets properly set.
add_action( 'plugins_loaded', 'configure_jitm', 1 );

function configure_jitm() {
    $config = new Config();
    $config->ensure( 'jitm' );
}
```

#### Directly Using the JITM Package

The JITMs can also be enabled by using the JITM package directly:

```
Automattic\Jetpack\JITMS\JITM::configure();
```

#### Where the JITM will be displayed

JITMs can be shown on any admin page that has the `<div id="jp-admin-notices" />` element within the dom, as it's where the messages are injected.
You may need to add or adjust this element to fit in your plugin.


### Adding Pre-Connection JITMs

Plugins can add pre-connection JITMs uisng the `jetpack_pre_connection_jitms` filter. Each JITM message must be an array and must contain the following keys:
 * id
 * message_path
 * message
 * description
 * button_link
 * button_caption

 If a JITM is missing one of the above keys, the JITM will not be displayed.

The JITM message array may also contain the following optional keys:
 * icon - When the 'icon' key does not exist, the Jetpack icon is used by default. The available settings for this option are:
	 * 'jetpack' for the Jetpack icon.
	 * 'woocommerce' for the WooCommerce icon.
	 * An empty string for no icon.

 The Jetpack plugin's pre-connection JITMs can be found in the `Jetpack_Pre_Connection_JITMs` class.

 #### Example


    function add_preconnection_jitms( $messages ) {
	    $example_jitm = array(
			'id'             => 'example-jitm',
			'message_path'   => '/wp:plugins:admin_notices/',
			'message'        => __( 'An example message.', 'jetpack' ),
			'description'    => __( 'An example description.', 'jetpack' ),
			'button_link'    => 'https://example.com/path',
			'button_caption' => __( 'Example button text', 'jetpack' ),
	    );

	    if ( ! is_array( $messages ) ) {
			return array( $example_jitm );
	    }

	    return array_merge( $messages, array( $example_jitm ) );
     }

     add_filter( 'jetpack_pre_connection_jitms', 'add_preconnection_jitms' );

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-jitm is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
