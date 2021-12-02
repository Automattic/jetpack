# Jetpack A/B Test

Provides an interface to the WP.com A/B tests.

Used to retrieve the variation of a valid, active A/B test running on WP.com for the current user.

### Usage

Retrieve the A/B test variation of the current user for the `example_abtest_name` A/B test:

```php
use Automattic\Jetpack\Abtest;

$abtest = new Abtest();
$variation = $abtest->get_variation( 'example_abtest_name' );
```

Will return `null` if the A/B test is invalid or is currently inactive.
