# Jetpack logo

A simple package that allows you to display a Jetpack logo somewhere.

### Usage

Display the default Jetpack logo:

```php
use Jetpack\Assets\Logo;

echo Logo::render();
```

Display a custom Jetpack logo of your choice:

```php
use Jetpack\Assets\Logo;

$url = plugins_url( 'images/jetpack-logo.svg', __DIR__ );
echo Logo::render( $url );
```
