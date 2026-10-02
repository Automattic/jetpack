import type { ToolsPanelProps } from '../types';
/**
 * The `ToolsPanel` is a container component that displays its children preceded
 * by a header. The header includes a dropdown menu which is automatically
 * generated from the panel's inner `ToolsPanelItems`.
 *
 * ```jsx
 * import { __ } from '@wordpress/i18n';
 * import {
 *   __experimentalToolsPanel as ToolsPanel,
 *   __experimentalToolsPanelItem as ToolsPanelItem,
 *   __experimentalUnitControl as UnitControl
 * } from '@wordpress/components';
 *
 * function Example() {
 *   const [ height, setHeight ] = useState();
 *   const [ width, setWidth ] = useState();
 *
 *   const resetAll = () => {
 *     setHeight();
 *     setWidth();
 *   }
 *
 *   return (
 *     <ToolsPanel label={ __( 'Dimensions' ) } resetAll={ resetAll }>
 *       <ToolsPanelItem
 *         hasValue={ () => !! height }
 *         label={ __( 'Height' ) }
 *         onDeselect={ () => setHeight() }
 *       >
 *         <UnitControl
 *           label={ __( 'Height' ) }
 *           onChange={ setHeight }
 *           value={ height }
 *         />
 *       </ToolsPanelItem>
 *       <ToolsPanelItem
 *         hasValue={ () => !! width }
 *         label={ __( 'Width' ) }
 *         onDeselect={ () => setWidth() }
 *       >
 *         <UnitControl
 *           label={ __( 'Width' ) }
 *           onChange={ setWidth }
 *           value={ width }
 *         />
 *       </ToolsPanelItem>
 *     </ToolsPanel>
 *   );
 * }
 * ```
 */
export declare const ToolsPanel: import("../../context").WordPressComponent<"div", ToolsPanelProps & import("react").RefAttributes<any>, true>;
export default ToolsPanel;
//# sourceMappingURL=component.d.ts.map