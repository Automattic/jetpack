# my-jetpack

WP Admin page with information and configuration shared among all Jetpack stand-alone plugins

## Usage

Every Jetpack plugin must include the My Jetpack package.

Require this package and initialize it:

```PHP
add_action( 'init', function() {
	Automattc\Jetpack\My_Jetpack\My_Jetpack::init();
});
```

That's all!

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

my-jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

