/**
 * CustomMediaToggle component
 * Toggle for sharing image as attachment instead of link preview
 */

import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';
import { MediaSourceType } from './types';
import { getAttachmentDescription } from './utils/media-source-options';

interface CustomMediaToggleProps {
	/**
	 * Current media source type
	 */
	source: MediaSourceType;

	/**
	 * Whether the toggle is checked (attached media is set)
	 */
	checked: boolean;

	/**
	 * Callback when toggle changes
	 */
	onChange: ( checked: boolean ) => void;

	/**
	 * Whether the toggle is disabled
	 */
	disabled?: boolean;
}

/**
 * Toggle for sharing image as attachment
 *
 * @param {CustomMediaToggleProps} props - Component props
 * @return {JSX.Element|null} CustomMediaToggle component
 */
export default function CustomMediaToggle( {
	source,
	checked,
	onChange,
	disabled = false,
}: CustomMediaToggleProps ) {
	const description = getAttachmentDescription( source );

	// Only show for sources that have an attachment description (featured-image, sig)
	if ( ! description ) {
		return null;
	}

	return (
		<div className={ styles[ 'custom-media-toggle' ] }>
			<ToggleControl
				label={ __( 'Share as attachment', 'jetpack-publicize-pkg' ) }
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
				help={ description }
				__nextHasNoMarginBottom={ true }
			/>
		</div>
	);
}
