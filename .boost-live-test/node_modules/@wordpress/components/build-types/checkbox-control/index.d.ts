import type { CheckboxControlProps } from './types';
import type { WordPressComponentProps } from '../context';
/**
 * Checkboxes allow the user to select one or more items from a set.
 *
 * ```jsx
 * import { CheckboxControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyCheckboxControl = () => {
 *   const [ isChecked, setChecked ] = useState( true );
 *   return (
 *     <CheckboxControl
 *       label="Is author"
 *       help="Is the user a author or not?"
 *       checked={ isChecked }
 *       onChange={ setChecked }
 *     />
 *   );
 * };
 * ```
 */
export declare function CheckboxControl(props: WordPressComponentProps<CheckboxControlProps, 'input', false>): import("react").JSX.Element;
export default CheckboxControl;
//# sourceMappingURL=index.d.ts.map