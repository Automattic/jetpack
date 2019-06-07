## Jetpack Affiliate Code

 This class introduces routines to get an affiliate code, that might be obtained from:
- a `jetpack_affiliate_code` option in the WP database
- an affiliate code returned by a filter bound to the `jetpack_affiliate_code` filter hook

### Usage

Display the default Jetpack logo:

```php
use Automattic\Jetpack\Partners\Affiliate;

$aff_code = Affiliate::init()->get_affiliate_code();
```
