import type { ForwardedRef } from 'react';
import type { InputControlProps } from './types';
export declare function UnforwardedInputControl(props: InputControlProps, ref: ForwardedRef<HTMLInputElement>): import("react").JSX.Element;
/**
 * InputControl components let users enter and edit text. This is an experimental component
 * intended to (in time) merge with or replace `TextControl`.
 *
 * ```jsx
 * import { __experimentalInputControl as InputControl } from '@wordpress/components';
 * import { useState } from 'react';
 *
 * const Example = () => {
 *   const [ value, setValue ] = useState( '' );
 *
 *   return (
 *  	<InputControl
 *  		value={ value }
 *  		onChange={ ( nextValue ) => setValue( nextValue ?? '' ) }
 *  	/>
 *   );
 * };
 * ```
 */
export declare const InputControl: import("react").ForwardRefExoticComponent<InputControlProps & import("react").RefAttributes<HTMLInputElement>>;
export default InputControl;
//# sourceMappingURL=index.d.ts.map