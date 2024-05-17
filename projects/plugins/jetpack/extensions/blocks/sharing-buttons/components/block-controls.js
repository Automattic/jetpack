import { BlockControls } from '@wordpress/block-editor';
import { ToolbarDropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

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

const SharingButtonsBlockControls = props => {
	const { attributes, setAttributes } = props;
	const { size } = attributes;

	const isSelectedValue = value => size === value || ( ! size && value === 'has-normal-icon-size' );

	return (
		<BlockControls group="other">
			<ToolbarDropdownMenu
				label={ __( 'Size', 'jetpack' ) }
				text={ __( 'Size', 'jetpack' ) }
				icon={ null }
				popoverProps={ { position: 'bottom right' } }
			>
				{ () => (
					<MenuGroup>
						{ sizeOptions.map( ( { name, value } ) => {
							return (
								<MenuItem
									icon={ isSelectedValue( value ) && check }
									isSelected={ isSelectedValue( value ) }
									key={ value }
									role="menuitemradio"
									onClick={ () => {
										setAttributes( { size: value } );
									} }
								>
									{ name }
								</MenuItem>
							);
						} ) }
					</MenuGroup>
				) }
			</ToolbarDropdownMenu>
		</BlockControls>
	);
};

export default SharingButtonsBlockControls;
