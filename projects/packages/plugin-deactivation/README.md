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

### Buttons
The buttons can also be customized as much as you want. However, you can dispatch events to control the dialog. These are the pre-defined events:
- `JetpackPluginDeactivation.events.close` to close the dialog
- `JetpackPluginDeactivation.events.deactivate` to deactivate and close the plugin

Example:

```HTML
<button 
		type="button"
		class="jp-plugin-deactivation__button"
		onclick="dispatchEvent(JetpackPluginDeactivation.events.close)"
	>Cancel</button>
```


## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

plugin-deactivation is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

