/**
 * Front-end script data for the Divi 5 VideoPress module.
 */
import { Fragment } from 'react';

/**
 * Registers the module's front-end script data.
 *
 * @param {object} props          - Script data props supplied by Divi.
 * @param {object} props.elements - The module element helpers.
 * @return {Element} The script data fragment.
 */
export const ModuleScriptData = ( { elements } ) => (
	<Fragment>
		{ elements.scriptData( {
			attrName: 'module',
		} ) }
	</Fragment>
);
