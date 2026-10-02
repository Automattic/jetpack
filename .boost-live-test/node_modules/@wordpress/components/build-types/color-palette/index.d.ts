import type { ColorPaletteProps, CustomColorPickerDropdownProps } from './types';
import type { WordPressComponentProps } from '../context';
export declare function CustomColorPickerDropdown({ isRenderedInSidebar, popoverProps: receivedPopoverProps, ...props }: CustomColorPickerDropdownProps): import("react").JSX.Element;
/**
 * Allows the user to pick a color from a list of pre-defined color entries.
 *
 * ```jsx
 * import { ColorPalette } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyColorPalette = () => {
 *   const [ color, setColor ] = useState ( '#f00' )
 *   const colors = [
 *     { name: 'red', color: '#f00' },
 *     { name: 'white', color: '#fff' },
 *     { name: 'blue', color: '#00f' },
 *   ];
 *   return (
 *     <ColorPalette
 *       colors={ colors }
 *       value={ color }
 *       onChange={ ( color ) => setColor( color ) }
 *     />
 *   );
 * } );
 * ```
 */
export declare const ColorPalette: import("react").ForwardRefExoticComponent<WordPressComponentProps<ColorPaletteProps, "div"> & import("react").RefAttributes<any>>;
export default ColorPalette;
//# sourceMappingURL=index.d.ts.map