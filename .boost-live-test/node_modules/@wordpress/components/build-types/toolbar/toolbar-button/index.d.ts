import type { ToolbarButtonOverriddenProps, ToolbarButtonProps } from './types';
import type { WordPressComponentProps } from '../../context';
/**
 * ToolbarButton can be used to add actions to a toolbar, usually inside a Toolbar
 * or ToolbarGroup when used to create general interfaces.
 *
 * ```jsx
 * import { Toolbar, ToolbarButton } from '@wordpress/components';
 * import { pencil } from '@wordpress/icons';
 *
 * function MyToolbar() {
 *   return (
 *		<Toolbar label="Options">
 *			<ToolbarButton
 *				icon={ pencil }
 *				label="Edit"
 *				onClick={ () => alert( 'Editing' ) }
 *			/>
 *		</Toolbar>
 *   );
 * }
 * ```
 */
export declare const ToolbarButton: import("react").ForwardRefExoticComponent<Omit<WordPressComponentProps<ToolbarButtonProps, import("react").ForwardRefExoticComponent<(import("../../button/types").ButtonProps & import("../../button/types").DeprecatedButtonProps) & import("react").RefAttributes<any>>, false>, "accessibleWhenDisabled"> & ToolbarButtonOverriddenProps & import("react").RefAttributes<any>>;
export default ToolbarButton;
//# sourceMappingURL=index.d.ts.map