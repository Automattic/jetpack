const { createRequire } = require( 'node:module' );
const path = require( 'node:path' );
const requireFromJsTools = createRequire(
	path.join( __dirname, '..', '..', '..', '..', 'js-tools', 'package.json' )
);
const { RuleTester } = requireFromJsTools( 'eslint' );
const rule = require( '../use-recommended-jetpack-components.cjs' );

const denylistPath = path.resolve(
	__dirname,
	'..',
	'..',
	'..',
	'jetpack-components-denylist.json'
);

const ruleTester = new RuleTester( {
	languageOptions: {
		sourceType: 'module',
		ecmaVersion: 'latest',
	},
} );

ruleTester.run( 'use-recommended-jetpack-components', rule, {
	valid: [
		"import { getRedirectUrl } from '@automattic/jetpack-api';",
		{
			code: "import { JetpackLogo } from '@automattic/jetpack-components';",
			options: [ { denylistPath: path.join( __dirname, 'fixtures', 'empty-denylist.json' ) } ],
		},
	],

	invalid: [
		{
			code: "import { Button } from '@automattic/jetpack-components';",
			options: [ { denylistPath } ],
			errors: [
				{
					message: 'Use `Button` from `@wordpress/ui` instead.',
				},
			],
		},
		{
			code: "import Button from '@automattic/jetpack-components/button';",
			options: [ { denylistPath } ],
			errors: [
				{
					message: 'Use `Button` from `@wordpress/ui` instead.',
				},
			],
		},
	],
} );
