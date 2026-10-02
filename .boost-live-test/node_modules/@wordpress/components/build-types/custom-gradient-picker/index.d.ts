import type { CustomGradientPickerProps } from './types';
/**
 * CustomGradientPicker is a React component that renders a UI for specifying
 * linear or radial gradients. Radial gradients are displayed in the picker as
 * a slice of the gradient from the center to the outside.
 *
 * ```jsx
 * import { CustomGradientPicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyCustomGradientPicker = () => {
 *   const [ gradient, setGradient ] = useState();
 *
 *   return (
 *     <CustomGradientPicker
 *			value={ gradient }
 *			onChange={ setGradient }
 *     />
 *   );
 * };
 * ```
 */
export declare function CustomGradientPicker({ value, onChange, enableAlpha, __experimentalIsRenderedInSidebar, }: CustomGradientPickerProps): import("react").JSX.Element;
export default CustomGradientPicker;
//# sourceMappingURL=index.d.ts.map