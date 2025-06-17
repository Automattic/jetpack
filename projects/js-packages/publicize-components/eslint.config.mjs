import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import jestConfig from 'jetpack-js-tools/eslintrc/jest.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'src/utils/test-factory.js' ],
	extends: [ jestConfig ],
} );
