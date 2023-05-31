# Jetpack Stats

Used to record internal usage stats for Automattic. Not visible to site owners.

## Usage

```php
$stats = new Automattic\Jetpack\A8c_Mc_Stats();

$stats->add( 'group', 'name' );

$stats->do_stats();

// or

$stats->do_server_side_stats();

```

Create an instance of the class and use the `add()` method to store stats that will be processed later with `do_stats()` or `do_server_side_stats()`;

`do_stats()` will output one `img` tag with the tracking gif for each group stored using `add()`.

`do_server_side_stats()` will directly ping the server, with no output, for each group stored using `add()`.

## Options

By default, this uses `b.gif`, which is a transparent pixel. If you want to use a tiny little smiley icon instead, initialize the class with `false`.

```php
$stats = new Automattic\Jetpack\A8c_Mc_Stats( false );
```

or set the property at any time:
```php
$stats->use_transparent_pixel = false;
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-a8c-mc-stats is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
