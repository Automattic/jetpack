/**
 * Style output for the Divi 5 VideoPress module.
 */
import { cssFields } from './custom-css';

const { CssStyle, StyleContainer } = window?.divi?.module ?? {};

/**
 * Renders the module's style tags.
 *
 * @param {object}  props                  - Style props supplied by Divi.
 * @param {object}  props.attrs            - The module attributes.
 * @param {string}  props.baseOrderClass   - The base order class.
 * @param {object}  props.elements         - The module element helpers.
 * @param {boolean} props.isCustomPostType - Whether rendering in a custom post type.
 * @param {string}  props.mode             - The current breakpoint mode.
 * @param {boolean} props.noStyleTag       - Whether to omit the wrapping style tag.
 * @param {string}  props.orderClass       - The module's order class.
 * @param {object}  props.settings         - The module settings.
 * @param {string}  props.state            - The current attribute state.
 * @return {Element} The style container.
 */
export const ModuleStyles = ( {
	attrs,
	baseOrderClass,
	elements,
	isCustomPostType,
	mode,
	noStyleTag,
	orderClass,
	settings,
	state,
} ) => (
	<StyleContainer mode={ mode } state={ state } noStyleTag={ noStyleTag }>
		{ elements.style( {
			attrName: 'module',
			styleProps: {
				disabledOn: {
					disabledModuleVisibility: settings?.disabledModuleVisibility,
				},
			},
		} ) }
		<CssStyle
			attr={ attrs.css }
			baseOrderClass={ baseOrderClass }
			cssFields={ cssFields }
			isCustomPostType={ isCustomPostType }
			orderClass={ orderClass }
			selector={ orderClass }
		/>
	</StyleContainer>
);
