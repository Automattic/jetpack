import type { PanelProps } from './types';
/**
 * `Panel` expands and collapses multiple sections of content.
 *
 * ```jsx
 * import { Panel, PanelBody, PanelRow } from '@wordpress/components';
 * import { more } from '@wordpress/icons';
 *
 * const MyPanel = () => (
 * 	<Panel header="My Panel">
 * 		<PanelBody title="My Block Settings" icon={ more } initialOpen={ true }>
 * 			<PanelRow>My Panel Inputs and Labels</PanelRow>
 * 		</PanelBody>
 * 	</Panel>
 * );
 * ```
 */
export declare const Panel: import("react").ForwardRefExoticComponent<PanelProps & import("react").RefAttributes<HTMLDivElement>>;
export default Panel;
//# sourceMappingURL=index.d.ts.map