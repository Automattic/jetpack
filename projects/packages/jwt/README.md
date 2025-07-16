# jwt

This

## How to install

```bash
composer install automattic/jetpack-jwt
```

### Installation From Git Repo


## Contribute
Create a PR in [Jetpack Repo]https://github.com/Automattic/jetpack.

## Get Help
Open in issue in the [Jetpack Repo]https://github.com/Automattic/jetpack.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.


### How to use the class?

```php
$payload = array(
    'hello' => 'world'
);
$secret = 'abc';

$jwt_string = Automattic/Jetpack/JWT::encode( $payload, $secret );

try{
    $descripted = Automattic/Jetpack/JWT::decode( $jwt_string, $secret );
} catch (Exception $e) {
    echo 'Caught exception: ',  $e->getMessage(), "\n";
}

echo $descripted->hello;
// prints "world"
```

### Testing

When introducing new features or making changes to existing code, please add tests.

To run the tests, you can use the following command:
Navigate to the JWT package directory and run.

```bash
composer test-php
```

### PHP Phan
In the jetpack repo

```bash
composer test-php packages/jwt
```

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jwt is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

