import autoProjects from '@automattic/jetpack-js-tools/eslintrc/auto-projects.mjs';
import makeBaseConfig from '@automattic/jetpack-js-tools/eslintrc/base.mjs';

export default [ ...makeBaseConfig( import.meta.url ), ...autoProjects ];
