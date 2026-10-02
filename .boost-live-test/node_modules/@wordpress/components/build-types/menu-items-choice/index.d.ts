import type { MenuItemsChoiceProps } from './types';
/**
 * `MenuItemsChoice` functions similarly to a set of `MenuItem`s, but allows the user to select one option from a set of multiple choices.
 *
 *
 * ```jsx
 * import { MenuGroup, MenuItemsChoice } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyMenuItemsChoice = () => {
 * 	const [ mode, setMode ] = useState( 'visual' );
 * 	const choices = [
 * 		{
 * 			value: 'visual',
 * 			label: 'Visual editor',
 * 		},
 * 		{
 * 			value: 'text',
 * 			label: 'Code editor',
 * 		},
 * 	];
 *
 * 	return (
 * 		<MenuGroup label="Editor">
 * 			<MenuItemsChoice
 * 				choices={ choices }
 * 				value={ mode }
 * 				onSelect={ ( newMode ) => setMode( newMode ) }
 * 			/>
 * 		</MenuGroup>
 * 	);
 * };
 * ```
 */
declare function MenuItemsChoice({ choices, onHover, onSelect, value, }: MenuItemsChoiceProps): import("react").JSX.Element;
export default MenuItemsChoice;
//# sourceMappingURL=index.d.ts.map