import autoProjects from 'jetpack-js-tools/eslintrc/auto-projects.mjs';
import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), autoProjects );
