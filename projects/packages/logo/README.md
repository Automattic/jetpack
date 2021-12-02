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
