import {
	useInnerBlocksProps,
	useBlockProps,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	MenuItemsChoice,
	ToolbarDropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './style.scss';
import { check } from '@wordpress/icons';
import classNames from 'classnames';

const ALLOWED_BLOCKS = [ 'jetpack/sharing-button' ];

const sizeOptions = [
	{
		name: __( 'Small', 'jetpack' ),
		value: 'has-small-icon-size',
	},
	{
		name: __( 'Normal', 'jetpack' ),
		value: 'has-normal-icon-size',
	},
	{
		name: __( 'Large', 'jetpack' ),
		value: 'has-large-icon-size',
	},
	{
		name: __( 'Huge', 'jetpack' ),
		value: 'has-huge-icon-size',
	},
];

export function SharingButtonsEdit( props ) {
	const { attributes, setAttributes } = props;

	const { styleType, size } = attributes;

	const SharingButtonsPlaceholder = (
		<li>{ __( 'Click plus to add a Sharing Button', 'jetpack' ) }</li>
	);

	const className = classNames( size, 'jetpack-sharing-buttons__services-list' );

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
			<BlockControls group="other">
				<ToolbarDropdownMenu
					label={ __( 'Size', 'jetpack' ) }
					text={ __( 'Size', 'jetpack' ) }
					icon={ null }
					popoverProps={ { position: 'bottom right' } }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ sizeOptions.map( entry => {
								return (
									<MenuItem
										icon={
											( size === entry.value ||
												( ! size && entry.value === 'has-normal-icon-size' ) ) &&
											check
										}
										isSelected={ size === entry.value }
										key={ entry.value }
										onClick={ () => {
											setAttributes( {
												size: entry.value,
											} );
										} }
										onClose={ onClose }
										role="menuitemradio"
									>
										{ entry.name }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					) }
				</ToolbarDropdownMenu>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<MenuItemsChoice
						choices={ [
							/* translators: Sharing: Sharing button option label. */
							{ value: 'icon-text', label: __( 'Icon & Text', 'jetpack' ) },
							/* translators: Sharing: Sharing button option label. */
							{ value: 'icon', label: __( 'Icon Only', 'jetpack' ) },
							/* translators: Sharing: Sharing button option label. */
							{ value: 'text', label: __( 'Text Only', 'jetpack' ) },
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
