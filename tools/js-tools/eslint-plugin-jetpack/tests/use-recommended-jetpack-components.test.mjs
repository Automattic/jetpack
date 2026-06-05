import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RuleTester } from 'eslint';
import rule from '../rules/use-recommended-jetpack-components.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const denylistPath = path.resolve(
	__dirname,
	'..',
	'..',
	'..',
	'eslint',
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
