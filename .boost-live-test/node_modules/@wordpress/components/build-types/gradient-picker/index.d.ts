import type { GradientPickerComponentProps } from './types';
/**
 * GradientPicker is a React component that renders a color gradient picker to
 * define a multi step gradient. There's either a _linear_ or a _radial_ type
 * available.
 *
 * ```jsx
 * import { useState } from 'react';
 * import { GradientPicker } from '@wordpress/components';
 *
 * const MyGradientPicker = () => {
 *   const [ gradient, setGradient ] = useState( null );
 *
 *   return (
 *     <GradientPicker
 *       value={ gradient }
 *       onChange={ ( currentGradient ) => setGradient( currentGradient ) }
 *       gradients={ [
 *         {
 *           name: 'JShine',
 *           gradient:
 *             'linear-gradient(135deg,#12c2e9 0%,#c471ed 50%,#f64f59 100%)',
 *           slug: 'jshine',
 *         },
 *         {
 *           name: 'Moonlit Asteroid',
 *           gradient:
 *             'linear-gradient(135deg,#0F2027 0%, #203A43 0%, #2c5364 100%)',
 *           slug: 'moonlit-asteroid',
 *         },
 *         {
 *           name: 'Rastafarie',
 *           gradient:
 *             'linear-gradient(135deg,#1E9600 0%, #FFF200 0%, #FF0000 100%)',
 *           slug: 'rastafari',
 *         },
 *       ] }
 *     />
 *   );
 * };
 *```
 *
 */
export declare function GradientPicker({ className, gradients, onChange, value, clearable, enableAlpha, disableCustomGradients, __experimentalIsRenderedInSidebar, headingLevel, ...additionalProps }: GradientPickerComponentProps): import("react").JSX.Element;
export default GradientPicker;
//# sourceMappingURL=index.d.ts.map