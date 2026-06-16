/**
 * Conversion outline mapping the Divi 4 `divi_videopress` shortcode attributes
 * to the Divi 5 attribute structure. Consumed during the layout migration that
 * Divi 5 runs on content authored with the legacy module.
 *
 * This outline is currently registered on the JS module only (see `index.js`).
 * Divi's build pipeline can also emit a `conversion-outline.json` for the
 * PHP-side migration via a webpack plugin; our build does not run that plugin
 * yet, so server-side migration of legacy layouts is not wired up.
 */
export const conversionOutline = {
	advanced: {
		admin_label: 'module.meta.adminLabel',
		animation: 'module.decoration.animation',
		background: 'module.decoration.background',
		disabled_on: 'module.decoration.disabledOn',
		module: 'module.advanced.htmlAttributes',
		overflow: 'module.decoration.overflow',
		position_fields: 'module.decoration.position',
		scroll: 'module.decoration.scroll',
		sticky: 'module.decoration.sticky',
		transform: 'module.decoration.transform',
		transition: 'module.decoration.transition',
		z_index: 'module.decoration.zIndex',
		margin_padding: 'module.decoration.spacing',
		max_width: 'module.decoration.sizing',
		height: 'module.decoration.sizing',
		box_shadow: {
			default: 'module.decoration.boxShadow',
		},
		borders: {
			default: 'module.decoration.border',
		},
		filters: {
			default: 'module.decoration.filters',
		},
	},
	css: {
		after: 'css.*.after',
		before: 'css.*.before',
		main_element: 'css.*.mainElement',
	},
	module: {
		guid: 'guid.innerContent.*',
	},
};
