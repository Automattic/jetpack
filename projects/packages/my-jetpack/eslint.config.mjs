import { makeBaseConfig, defineConfig, jestFiles } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ '_inc/components/settings-panel/**' ],
	ignores: [ '_inc/components/settings-panel/panel-module-toggle.tsx', ...jestFiles ],
	rules: {
		'no-restricted-imports': [
			'error',
			{
				patterns: [
					{
						regex: '(^|/)module-toggle(/.*)?$',
						message:
							'Use PanelModuleToggle from ./panel-module-toggle instead: a bare ModuleToggle records no Tracks event when switched.',
					},
				],
			},
		],
	},
} );
