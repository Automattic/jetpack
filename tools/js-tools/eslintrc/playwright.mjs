import { defineConfig } from 'eslint/config';
import eslintPluginPlaywright from 'eslint-plugin-playwright';

export default defineConfig( eslintPluginPlaywright.configs[ 'flat/recommended' ] );
