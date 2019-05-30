# Jetpack Just In Time Messages

A package encapsulating Just In Time Messages

### Usage TODO

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
