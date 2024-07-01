# stub-generator

Extract stubs for specific functions/classes/etc from a codebase.

This is intended for situations where you want stubs for specific parts of a large code base.
If you want to extract stubs for everything, something like [php-stubs/generator](https://packagist.org/packages/php-stubs/generator) might work better for you.

## Usage

This is a fairly simple command-line application:

```
vendor/bin/jetpack-stub-generator definition-file.php
```

### Options

--json
: Definition file is JSON rather than PHP.

--output _&lt;file&gt;_
: Write the stubs to the specified file, rather than to standard output.

### Definition file

The definition file specifies which stubs are extracted from which files, and some other configuration.

The annotated example here is in PHP format. Equivalent JSON structure may be used with the `--json` flag.

```php

<?php

return [
	// Text to put at the top of the output, after the opening `<?php`. Default empty.
	'header' => '',

	// Text to put at the end of the output. Default empty.
	'footer' => '',

	// Set true to strip descriptions and unrecognized tags from the phpdoc.
	'strip-docs' => false,

	// Path which `files` are relative to. Defaults to the directory containing the definition file,
	// and if it's relative it's relative to that.
	'basedir' => '.',

	// Files to process, and what to extract from them.
	'files' => [
		'path/to/file.php' => [
			// Constants to extract, by name.
			'constant' => [ 'CONSTANT_ONE', 'CONSTANT_TWO' ],

			// Functions to extract, by name.
			'function' => [ 'functionOne', 'functionTwo' ],

			// Classes to extract,
			'class' => [
				'ClassName' => [
					'constant' => [ 'CLASS_CONSTANT' ],
					'property' => [ 'propertyName' ],
					'method' => [ 'methodName', 'staticOrDynamicNoDifference' ],
				],
			],
			'interface' => [ /* constants, properties, and methods, just like classes */ ],
			'trait' => [ /* constants, properties, and methods, just like classes */ ],
		],

		// A `'*'` can be used to avoid having to list everything, if you want everything in a file.
		'path/to/file2.php' => [
			// If you want to extract everything in a category from the file, you can do it like this.
			'function' => '*',

			'class' => [
				// It also works for extracting parts of classes, interfaces, and traits.
				'ClassName' => [
					'property' => '*',
					'method' => '*',
				],

				// And for whole classes, interfaces, and traits for that matter.
				'ClassName2' => '*',
			],
		],

		// This works too.
		'path/to/file3.php' => '*',

		// OTOH, there's no globbing or "entire directory" functionality for filenames.
		// Since this is a PHP file, you can easily do that yourself.
	],
];
```

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

stub-generator is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

