import type { ToolbarGroupProps } from './types';
/**
 * Renders a collapsible group of controls
 *
 * The `controls` prop accepts an array of sets. A set is an array of controls.
 * Controls have the following shape:
 *
 * ```
 * {
 *   icon: string,
 *   title: string,
 *   subscript: string,
 *   onClick: Function,
 *   isActive: boolean,
 *   isDisabled: boolean
 * }
 * ```
 *
 * For convenience it is also possible to pass only an array of controls. It is
 * then assumed this is the only set.
 *
 * Either `controls` or `children` is required, otherwise this components
 * renders nothing.
 *
 * @param props               Component props.
 * @param [props.controls]    The controls to render in this toolbar.
 * @param [props.children]    Any other things to render inside the toolbar besides the controls.
 * @param [props.className]   Class to set on the container div.
 * @param [props.isCollapsed] Turns ToolbarGroup into a dropdown menu.
 * @param [props.title]       ARIA label for dropdown menu if is collapsed.
 */
declare function ToolbarGroup({ controls, children, className, isCollapsed, title, ...props }: ToolbarGroupProps): import("react").JSX.Element | null;
export default ToolbarGroup;
//# sourceMappingURL=index.d.ts.map