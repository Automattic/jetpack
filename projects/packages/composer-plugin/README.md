# composer-plugin

The custom installer plugin for Composer. It changes the path of specific libraries to be installed into `jetpack_vendor` instead of `vendor` folders. To do that the `type` of the project needs to be set to
`jetpack-library`.`

## How to install composer-plugin

This plugin needs to be put into the `require` section of your `composer.json` file in order to be used.

```json
	"require": {
		"automattic/jetpack-composer-plugin": "*"
	},
```

## License

composer-plugin is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

