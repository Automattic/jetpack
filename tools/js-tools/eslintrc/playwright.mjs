import eslintPluginPlaywright from 'eslint-plugin-playwright';
import eslintPluginTestingLibrary from 'eslint-plugin-testing-library';
import { defineConfig, javascriptFiles } from './base.mjs';

export default defineConfig(
	{
		files: javascriptFiles,
		extends: [ eslintPluginPlaywright.configs[ 'flat/recommended' ] ],
	},
	{
		name: 'Disable testing-library, conflicts with playwright',
		files: javascriptFiles,
		rules: {
			...Object.fromEntries(
				Object.keys( eslintPluginTestingLibrary.rules ).map( k => [
					`testing-library/${ k }`,
					'off',
				] )
			),
		},
	}
);
