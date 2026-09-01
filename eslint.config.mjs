// WARNING: If you (or your AI) think you need to edit this file to fix some eslint issue in a project,
// you're almost certainly wrong. Ask for help.

import autoProjects from 'jetpack-js-tools/eslintrc/auto-projects.mjs';
import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), autoProjects );
