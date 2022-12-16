# promote-posts

Attract high-quality traffic to your site using Promoted Posts. Using this service, you can advertise a post or page on some of the millions of pages across WordPress.com and Tumblr.

## How to install promote-posts

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-promote-posts).

Use composer to add the package to your project:
```bash
composer add automattic/jetpack-promote-posts
```

Then you can initialize it on the `admin_init` hook:

```php
add_action( 'admin_init', array( '\Automattic\Jetpack\Promote_Posts', 'configure' ) );
```

Or directly invoke with a method call: 
```php
use Automattic\Jetpack\Promote_Posts;
Promote_Posts::configure();
```

## Development

### Production
```bash
jetpack build -p packages/promote-posts
```

### Development
```bash
jetpack build packages/promote-posts
```

### Development Watching Mode 👀
```bash
jetpack watch packages/promote-posts
```


## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

promote-posts is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

