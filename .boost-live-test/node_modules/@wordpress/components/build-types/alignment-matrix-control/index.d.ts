import AlignmentMatrixControlIcon from './icon';
import type { WordPressComponentProps } from '../context';
import type { AlignmentMatrixControlProps } from './types';
declare function UnforwardedAlignmentMatrixControl({ className, id, label, defaultValue, value, onChange, width, ...props }: WordPressComponentProps<AlignmentMatrixControlProps, 'div', false>): import("react").JSX.Element;
/**
 * AlignmentMatrixControl components enable adjustments to horizontal and vertical alignments for UI.
 *
 * ```jsx
 * import { AlignmentMatrixControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const Example = () => {
 * 	const [ alignment, setAlignment ] = useState( 'center center' );
 *
 * 	return (
 * 		<AlignmentMatrixControl
 * 			value={ alignment }
 * 			onChange={ setAlignment }
 * 		/>
 * 	);
 * };
 * ```
 */
export declare const AlignmentMatrixControl: typeof UnforwardedAlignmentMatrixControl & {
    /**
     * Render an alignment matrix as an icon.
     *
     * ```jsx
     * import { AlignmentMatrixControl } from '@wordpress/components';
     *
     * <Icon icon={<AlignmentMatrixControl.Icon value="top left" />} />
     * ```
     */
    Icon: typeof AlignmentMatrixControlIcon & {
        displayName: string;
    };
};
export default AlignmentMatrixControl;
//# sourceMappingURL=index.d.ts.map