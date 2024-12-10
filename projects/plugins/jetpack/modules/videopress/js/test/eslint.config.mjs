// eslint config in modules/eslint.config.mjs is screwy for historical reasons that don't apply to tests.
// Reset to match Jetpack's root dir, then manually add jestConfig since eslint won't see that this is inside a /test/ subdir to apply it automatically.
import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';
import jestConfig from 'jetpack-js-tools/eslintrc/jest.mjs';

export default [ ...makeBaseConfig( import.meta.url ), ...jestConfig ];
