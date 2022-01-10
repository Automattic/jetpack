# my-jetpack

WP Admin page with information and configuration shared among all Jetpack stand-alone plugins

## Usage

Every Jetpack plugin must include the My Jetpack package.

Require this package and initialize it:

```PHP
add_action( 'init', function() {
	Automattic\Jetpack\My_Jetpack\Initializer::init();
});
```

That's all!
## Develop

Simply take advantage of the awesome [Jetpack CLI](/../../../tools/cli/Readme.md). For instance:

**Build the project**
```cli
jetpack build projects/my-jetpack
```

**Watch (and build) the project**
```
jetpack watch projects/my-jetpack
```

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

my-jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

