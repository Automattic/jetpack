import {
	InspectorControls,
	ContrastChecker,
	withColors,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { PanelBody, MenuItemsChoice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const SharingButtonsInspectorControls = props => {
	const {
		clientId,
		attributes,
		iconBackgroundColor,
		iconColor,
		setAttributes,
		setIconBackgroundColor,
		setIconColor,
	} = props;

	const { iconBackgroundColorValue, iconColorValue } = attributes;
	const { styleType } = attributes;

	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const colorSettings = [
		{
			// Use custom attribute as fallback to prevent loss of named color selection when
			// switching themes to a new theme that does not have a matching named color.
			value: iconColor.color || iconColorValue,
			onChange: colorValue => {
				setIconColor( colorValue );
				setAttributes( { iconColorValue: colorValue } );
			},
			label: __( 'Icon color', 'jetpack' ),
			resetAllFilter: () => {
				setIconColor( undefined );
				setAttributes( { iconColorValue: undefined } );
			},
		},
		{
			// Use custom attribute as fallback to prevent loss of named color selection when
			// switching themes to a new theme that does not have a matching named color.
			value: iconBackgroundColor.color || iconBackgroundColorValue,
			gradients: '',
			onChange: colorValue => {
				setIconBackgroundColor( colorValue );
				setAttributes( {
					iconBackgroundColorValue: colorValue,
				} );
			},
			onGradientChange: () => {},
			label: __( 'Icon background', 'jetpack' ),
			resetAllFilter: () => {
				setIconBackgroundColor( undefined );
				setAttributes( { iconBackgroundColorValue: undefined } );
			},
		},
	];

	return (
		<>
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
			<InspectorControls group="color">
				{ colorSettings.map( ( { onChange, label, value, resetAllFilter } ) => (
					<ColorGradientSettingsDropdown
						key={ `social-links-color-${ label }` }
						__experimentalIsRenderedInSidebar
						settings={ [
							{
								colorValue: value,
								label,
								onColorChange: onChange,
								isShownByDefault: true,
								resetAllFilter,
								enableAlpha: true,
								clearable: true,
							},
						] }
						panelId={ clientId }
						gradients={ '' }
						{ ...colorGradientSettings }
					/>
				) ) }
				<ContrastChecker
					{ ...{
						textColor: iconColorValue,
						backgroundColor: iconBackgroundColorValue,
					} }
					isLargeText={ false }
				/>
			</InspectorControls>
		</>
	);
};
const iconColorAttributes = {
	iconColor: 'icon-color',
	iconBackgroundColor: 'icon-background-color',
};

export default withColors( iconColorAttributes )( SharingButtonsInspectorControls );
