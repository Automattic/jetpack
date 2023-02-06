import { PanelColorSettings } from '@wordpress/block-editor';
import {
	BaseControl,
	TextControl,
	TextareaControl,
	SelectControl,
	Path,
	ToggleControl,
	Button,
	PanelBody,
	ToolbarGroup,
	Dropdown,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import HelpMessage from '../../../shared/help-message';
import renderMaterialIcon from '../../../shared/render-material-icon';
import { countryCodes } from '../shared/countrycodes.js';

const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_DARK = '#465B64';
const WHATSAPP_LIGHT = '#F4F4F4';

export default function WhatsAppButtonConfiguration( { attributes, setAttributes, context } ) {
	const { countryCode, phoneNumber, firstMessage, openInNewTab, backgroundColor } = attributes;

	const [ isValidPhoneNumber, setIsValidPhoneNumber ] = useState( true );

	const validatePhoneNumber = newPhoneNumber => {
		// No alphabetical characters but allow dots, dashes, and brackets.
		// These will be stripped for the WhatsApp API (only numbers), but retain
		// them in the UI for a more readable number for the user.
		const phoneNumberRegEx = RegExp( /^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'g' );

		if ( undefined === newPhoneNumber || newPhoneNumber.length < 1 ) {
			return false;
		}

		return phoneNumberRegEx.test( countryCode.replace( /\D/g, '' ) + newPhoneNumber );
	};

	const setBackgroundColor = color => {
		setAttributes( { backgroundColor: color } );

		if ( color === undefined || color === WHATSAPP_GREEN || color === WHATSAPP_DARK ) {
			return setAttributes( { colorClass: 'dark' } );
		}

		setAttributes( { colorClass: 'light' } );
	};

	const renderSettingsToggle = ( isOpen, onToggle ) => {
		const openOnArrowDown = event => {
			if ( ! isOpen && event.keyCode === DOWN ) {
				event.preventDefault();
				event.stopPropagation();
				onToggle();
			}
		};

		return (
			<Button
				className="components-toolbar__control jetpack-contact-form__toggle"
				label={ __( 'WhatsApp Button Settings', 'jetpack' ) }
				onClick={ onToggle }
				onKeyDown={ openOnArrowDown }
				icon={ renderMaterialIcon(
					<Path d="M10.82 12.49c.02-.16.04-.32.04-.49 0-.17-.02-.33-.04-.49l1.08-.82c.1-.07.12-.21.06-.32l-1.03-1.73c-.06-.11-.2-.15-.31-.11l-1.28.5c-.27-.2-.56-.36-.87-.49l-.2-1.33c0-.12-.11-.21-.24-.21H5.98c-.13 0-.24.09-.26.21l-.2 1.32c-.31.12-.6.3-.87.49l-1.28-.5c-.12-.05-.25 0-.31.11l-1.03 1.73c-.06.12-.03.25.07.33l1.08.82c-.02.16-.03.33-.03.49 0 .17.02.33.04.49l-1.09.83c-.1.07-.12.21-.06.32l1.03 1.73c.06.11.2.15.31.11l1.28-.5c.27.2.56.36.87.49l.2 1.32c.01.12.12.21.25.21h2.06c.13 0 .24-.09.25-.21l.2-1.32c.31-.12.6-.3.87-.49l1.28.5c.12.05.25 0 .31-.11l1.03-1.73c.06-.11.04-.24-.06-.32l-1.1-.83zM7 13.75c-.99 0-1.8-.78-1.8-1.75s.81-1.75 1.8-1.75 1.8.78 1.8 1.75S8 13.75 7 13.75zM18 1.01L8 1c-1.1 0-2 .9-2 2v3h2V5h10v14H8v-1H6v3c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99z" />
				) }
			/>
		);
	};
	const settings = () => (
		<>
			<BaseControl
				label={ __( 'Phone Number', 'jetpack' ) }
				help={ __(
					'Enter the phone number you use for WhatsApp and would like to be contacted on.',
					'jetpack'
				) }
				className="jetpack-whatsapp-button__phonenumber"
			>
				<SelectControl
					label={ __( 'Country code', 'jetpack' ) }
					value={ countryCode }
					onChange={ value => setAttributes( { countryCode: value } ) }
					options={ countryCodes }
					hideLabelFromVision={ true }
				/>

				<TextControl
					placeholder={ __( 'Your phone number…', 'jetpack' ) }
					onChange={ newPhoneNumber => {
						setAttributes( { phoneNumber: newPhoneNumber } );

						if ( newPhoneNumber.length === 0 ) {
							setIsValidPhoneNumber( true );
						}

						if ( newPhoneNumber.length > 2 ) {
							setIsValidPhoneNumber( validatePhoneNumber( newPhoneNumber ) );
						}
					} }
					value={ phoneNumber }
				/>

				{ ! isValidPhoneNumber && (
					<HelpMessage isError className="jetpack-whatsapp-error">
						{ __( 'Please enter a valid phone number.', 'jetpack' ) }
					</HelpMessage>
				) }
			</BaseControl>
			{ context === 'inspector' && (
				<>
					<TextareaControl
						label={ __( 'Default First Message', 'jetpack' ) }
						help={ __(
							'The default first message that will be sent by visitors when using this button.',
							'jetpack'
						) }
						value={ firstMessage }
						onChange={ text => setAttributes( { firstMessage: text } ) }
					/>

					<ToggleControl
						label={ __( 'Open in new tab', 'jetpack' ) }
						checked={ openInNewTab }
						onChange={ newValue => setAttributes( { openInNewTab: newValue } ) }
						help={ __(
							'When the button is tapped, should a new tab be opened if the visitor does not have WhatsApp installed?',
							'jetpack'
						) }
					/>
				</>
			) }
		</>
	);

	if ( context === 'toolbar' ) {
		// This should be updated to use ToolbarItem
		// when Jetpack uses @wordpress/components v. 10.1.0+.
		return (
			<ToolbarGroup>
				<Dropdown
					position="bottom right"
					className="jetpack-whatsapp-button-settings-selector"
					contentClassName="jetpack-whatsapp-button__popover"
					renderToggle={ ( { isOpen, onToggle } ) => renderSettingsToggle( isOpen, onToggle ) }
					renderContent={ settings }
				/>
			</ToolbarGroup>
		);
	}

	return (
		<>
			<PanelBody title={ __( 'WhatsApp Button Settings', 'jetpack' ) } initialOpen={ true }>
				{ settings() }
			</PanelBody>

			<PanelColorSettings
				title={ __( 'Color Settings', 'jetpack' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: backgroundColor,
						onChange: color => setBackgroundColor( color ),
						label: __( 'Background Color', 'jetpack' ),
						disableCustomColors: true,
						colors: [
							{
								name: _x( 'WhatsApp Green', 'background color name', 'jetpack' ),
								slug: 'whatsapp-green',
								color: WHATSAPP_GREEN,
							},
							{
								name: _x( 'WhatsApp Dark', 'background color name', 'jetpack' ),
								slug: 'whatsapp-dark',
								color: WHATSAPP_DARK,
							},
							{
								name: _x( 'WhatsApp Light', 'background color name', 'jetpack' ),
								slug: 'whatsapp-light',
								color: WHATSAPP_LIGHT,
							},
							{
								name: _x( 'White', 'background color name', 'jetpack' ),
								slug: 'whatsapp-white',
								color: '#FFFFFF',
							},
						],
					},
				] }
			></PanelColorSettings>
		</>
	);
}
