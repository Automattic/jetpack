import { useInnerBlocksProps, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, MenuItemsChoice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './style.scss';

const ALLOWED_BLOCKS = [ 'jetpack/sharing-button' ];

export function SharingButtonsEdit( props ) {
	const { attributes, setAttributes } = props;

	const { styleType } = attributes;

	const SharingButtonsPlaceholder = (
		<li>{ __( 'Click plus to add a Sharing Button', 'jetpack' ) }</li>
	);

	const className = 'jetpack-sharing-buttons__services-list';

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
					<MenuItemsChoice
						choices={ [
							{ value: 'icon-text', label: 'Icon & Text' },
							{ value: 'icon', label: 'Icon Only' },
							{ value: 'text', label: 'Text Only' },
							{ value: 'official', label: 'Official Buttons' },
						] }
						value={ styleType }
						onSelect={ value => setAttributes( { styleType: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ul { ...innerBlocksProps } />
		</>
	);
}
export default SharingButtonsEdit;
