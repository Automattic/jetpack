//Sharing Buttons Block
/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';

const ALLOWED_BLOCKS = [ 'jetpack/sharing-button' ];
// const ALLOWED_BLOCKS = [ 'core/social-link' ];

export function SocialLinksEdit( props ) {
	const { attributes, setAttributes } = props;

	const { openInNewTab, showLabels } = attributes;

	// const logosOnly = attributes.className?.includes( 'is-style-logos-only' );

	const SharingButtonsPlaceholder = <li>{ __( 'Click plus to add', 'jetpack' ) }</li>;

	const className = 'jetpack-sharing-buttons__sharing-services-list';

	const blockProps = useBlockProps( { className } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		placeholder: SharingButtonsPlaceholder,
		templateLock: false,
		orientation: attributes.layout?.orientation ?? 'horizontal',
		sharingEventsAdded: true,
		__experimentalAppenderTagName: 'li',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Open links in new tab', 'jetpack' ) }
						checked={ openInNewTab }
						onChange={ () => setAttributes( { openInNewTab: ! openInNewTab } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show labels', 'jetpack' ) }
						checked={ showLabels }
						onChange={ () => setAttributes( { showLabels: ! showLabels } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</>
	);
}
export default SocialLinksEdit;
