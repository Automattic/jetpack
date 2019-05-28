# Jetpack logo

A simple package that allows you to display a Jetpack logo somewhere.

### Usage

Display the default Jetpack logo:

```php
use Automattic\Jetpack\Assets\Logo;

$logo = new Logo();
echo $logo->render();
```

Display a custom Jetpack logo of your choice:

```php
use Automattic\Jetpack\Assets\Logo;

$url = plugins_url( 'images/jetpack-logo.svg', __DIR__ );
$logo = new Logo( $url );
echo $logo->render();
```
