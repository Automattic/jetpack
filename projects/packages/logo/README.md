# Jetpack logo

A package that allows you to obtain a Jetpack logo in SVG format.

### Usage

Display the default Jetpack logo:

```php
use Automattic\Jetpack\Assets\Logo;

$logo = new Logo();
echo $logo->render();
```

### Styling

The Jetpack logo SVG string includes CSS classes to stylize it:
- `jetpack-logo`: the wrapper <svg> tag.
- `jetpack-logo__icon-circle`: the circle of the Jetpack mark.
- `jetpack-logo__icon-triangle`: two shapes that correspond to each triangle in the Jetpack mark.
- `jetpack-logo__icon-text`: the Jetpack lettering.

These shapes can be stylized using CSS. For example, to give the circle and text a blue gray color, we can do:

```css
.jetpack-logo__icon-circle,
.jetpack-logo__text {
	fill: #636d75;
}
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-logo is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
