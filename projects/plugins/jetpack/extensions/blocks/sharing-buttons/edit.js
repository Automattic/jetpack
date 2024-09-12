import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import './style.scss';
import clsx from 'clsx';
import SharingButtonsBlockControls from './components/block-controls';
import SharingButtonsInspectorControls from './components/inspector-controls';

const ALLOWED_BLOCKS = [ 'jetpack/sharing-button' ];

function SharingButtonsEdit( props ) {
	const { attributes } = props;
	const { size } = attributes;

	const SharingButtonsPlaceholder = (
		<li>{ __( 'Click plus to add a Sharing Button', 'jetpack' ) }</li>
	);

	const className = clsx( size, 'jetpack-sharing-buttons__services-list' );

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
			<SharingButtonsBlockControls { ...props } />
			<SharingButtonsInspectorControls { ...props } />
			<ul { ...innerBlocksProps } />
		</>
	);
}

export default SharingButtonsEdit;
