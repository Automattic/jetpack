/**
 * WordPress dependencies
 */
import { PanelBody, TextControl, BottomSheetTextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import VideoNotOwnedWarning from '../video-not-owned-warning';

/**
 * React component that renders the details settings panel.
 *
 * @param {object} props - Component properties.
 * @param {object} props.attributes - Block attributes.
 * @param {Function} props.setAttributes - Function to set attributes.
 * @param {Function} props.videoBelongToSite - Determines if the video belongs to the current site.
 * @returns {import('react').ReactElement} - Details panel component.
 */
export default function DetailsPanel( { attributes, setAttributes, videoBelongToSite } ) {
	const { title, description } = attributes;
	const titlePlaceholder = videoBelongToSite
		? __( 'Add title', 'jetpack-videopress-pkg' )
		: __( 'No title', 'jetpack-videopress-pkg' );
	const descriptionPlaceholder = videoBelongToSite
		? __( 'Add description', 'jetpack-videopress-pkg' )
		: __( 'No description', 'jetpack-videopress-pkg' );

	return (
		<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
			<TextControl
				value={ title || '' }
				onChange={ value => setAttributes( { title: value } ) }
				placeholder={ titlePlaceholder }
				label={ __( 'Title', 'jetpack-videopress-pkg' ) }
				disabled={ ! videoBelongToSite }
			/>
			<BottomSheetTextControl
				initialValue={ description }
				onChange={ value => setAttributes( { description: value } ) }
				placeholder={ descriptionPlaceholder }
				label={ __( 'Description', 'jetpack-videopress-pkg' ) }
				disabled={ ! videoBelongToSite }
			/>
			{ ! videoBelongToSite && <VideoNotOwnedWarning /> }
		</PanelBody>
	);
}
