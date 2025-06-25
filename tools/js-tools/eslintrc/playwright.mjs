import eslintPluginPlaywright from 'eslint-plugin-playwright';
import { defineConfig, javascriptFiles } from './base.mjs';

export default defineConfig( {
	files: javascriptFiles,
	extends: [ eslintPluginPlaywright.configs[ 'flat/recommended' ] ],
} );
