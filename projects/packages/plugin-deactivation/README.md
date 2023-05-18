# plugin-deactivation

Intercept the plugin deactivation with a dialog

![](https://d.pr/i/EJcfWh+)

## How to install plugin-deactivation

Instantiate the `Deactivation_Handler` by providing the `$plugin_slug`, and `$dialog_view_file_path` as parameters.

```PHP
add_action( 'init', function() {
	Automattic\Jetpack\Plugin_Deactivation\Deactivation_Handler::init( $plugin_slug, $dialog_view_file_path );
} );
```


| Parameter                 | Description                                                                                                                                                                        |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `$plugin_slug`           | Slug of the plugin, e.g. `jetpack`, `jetpack-boost`.                                                                                                                               |
| `$dialog_view_file_path` | The path to a PHP file that contains the markup for your dialog.  Copy `src/dialog-template.php` to your plugin, customize it, and  pass its path as the `$dialog_view_file_path`. |

### Controlling the dialog

#### Using attribute
You can use `data-jp-plugin-deactivation-action` attribute with the values `close`|`deactivate` on any element. Adding this attribute will observe the element and
close or deactivate the plugin based on the attribute value.

Example of a button that closes the dialog:

```HTML
<button 
		type="button"
		class="jp-plugin-deactivation__button"
		data-jp-plugin-deactivation-action="close"
	>Cancel</button>
```

#### Using the instance

You can access the deactivation dialog instance in `window.JetpackPluginDeactivationData[<plugin slug>]`. It has access to the following methods:

- `showDialog()` - Open the deactivation dialog
- `hideDialog()` - Close the deactivation dialog
- `deactivate()` - Deactivate the plugin and close the dialog

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

plugin-deactivation is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

