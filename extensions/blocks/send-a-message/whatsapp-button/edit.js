/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	Button,
	BaseControl,
	TextControl,
	TextareaControl,
	SelectControl,
	PanelBody,
	ToolbarGroup,
	Dropdown,
	Path,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	RichText,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { countryCodes } from '../shared/countrycodes.js';
import renderMaterialIcon from '../../../shared/render-material-icon';
import './view.scss';

export default function WhatsAppButtonEdit( { attributes, setAttributes, className } ) {
	const {
		countryCode,
		phoneNumber,
		buttonText,
		firstMessage,
		colorClass,
		backgroundColor,
	} = attributes;

	const [ isValidPhoneNumber, setIsValidPhoneNumber ] = useState( false );

	const getCountryCode = async () => {
		setAttributes( { countryCode: '1' } );

		const geoFetch = await fetch( 'http://ip-api.com/json/?fields=countryCode' )
			.then( response => {
				if ( ! response.ok ) {
					return false;
				}

				return response;
			} )
			.catch( () => {
				return false;
			} );

		if ( geoFetch ) {
			const geo = await geoFetch.json();

			countryCodes.forEach( item => {
				if ( item.code === geo.countryCode ) {
					setAttributes( { countryCode: item.value } );
				}
			} );
		}
	};

	useEffect( () => {
		if ( undefined !== countryCode ) {
			return;
		}

		getCountryCode();
	} );

	const validatePhoneNumber = newPhoneNumber => {
		const phoneNumberRegEx = RegExp( /^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'g' );

		if ( undefined === newPhoneNumber || newPhoneNumber.length < 1 ) {
			return false;
		}

		return phoneNumberRegEx.test( countryCode.replace( /\D/g, '' ) + newPhoneNumber );
	};

	const onBlurPhoneNumber = e => {
		setIsValidPhoneNumber( validatePhoneNumber( '' ) );
	};

	const setBackgroundColor = color => {
		setAttributes( { backgroundColor: color } );

		if ( color === undefined || color === '#25D366' || color === '#465B64' ) {
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
				label={ __( 'Edit Form Settings' ) }
				onClick={ onToggle }
				onKeyDown={ openOnArrowDown }
				icon={ renderMaterialIcon(
					<Path d="M10.82 12.49c.02-.16.04-.32.04-.49 0-.17-.02-.33-.04-.49l1.08-.82c.1-.07.12-.21.06-.32l-1.03-1.73c-.06-.11-.2-.15-.31-.11l-1.28.5c-.27-.2-.56-.36-.87-.49l-.2-1.33c0-.12-.11-.21-.24-.21H5.98c-.13 0-.24.09-.26.21l-.2 1.32c-.31.12-.6.3-.87.49l-1.28-.5c-.12-.05-.25 0-.31.11l-1.03 1.73c-.06.12-.03.25.07.33l1.08.82c-.02.16-.03.33-.03.49 0 .17.02.33.04.49l-1.09.83c-.1.07-.12.21-.06.32l1.03 1.73c.06.11.2.15.31.11l1.28-.5c.27.2.56.36.87.49l.2 1.32c.01.12.12.21.25.21h2.06c.13 0 .24-.09.25-.21l.2-1.32c.31-.12.6-.3.87-.49l1.28.5c.12.05.25 0 .31-.11l1.03-1.73c.06-.11.04-.24-.06-.32l-1.1-.83zM7 13.75c-.99 0-1.8-.78-1.8-1.75s.81-1.75 1.8-1.75 1.8.78 1.8 1.75S8 13.75 7 13.75zM18 1.01L8 1c-1.1 0-2 .9-2 2v3h2V5h10v14H8v-1H6v3c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99z" />
				) }
			/>
		);
	};

	const renderSettings = () => {
		return (
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
						value={ countryCode }
						onChange={ value => setAttributes( { countryCode: value } ) }
						options={ countryCodes }
					/>
					<TextControl
						placeholder={ __( 'Your phone number…', 'jetpack' ) }
						onBlur={ newPhoneNumber => onBlurPhoneNumber( newPhoneNumber ) }
						onChange={ newPhoneNumber => setAttributes( { phoneNumber: newPhoneNumber } ) }
						value={ phoneNumber }
					/>
				</BaseControl>

				<TextareaControl
					label={ __( 'Default First Message', 'jetpack' ) }
					help={ __(
						'The default first message that will be sent by visitors when using this button.',
						'jetpack'
					) }
					value={ firstMessage }
					onChange={ text => setAttributes( { firstMessage: text } ) }
				/>
			</>
		);
	};

	return (
		<div className={ className + ' is-color-' + colorClass }>
			{ ToolbarGroup && (
				<BlockControls>
					<ToolbarGroup>
						<Dropdown
							position="bottom right"
							className="jetpack-contact-form-settings-selector"
							contentClassName="jetpack-contact-form__popover"
							renderToggle={ ( { isOpen, onToggle } ) => renderSettingsToggle( isOpen, onToggle ) }
							renderContent={ () => renderSettings() }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }

			<InspectorControls>
				<PanelBody title="WhatsApp Button Settings" initialOpen={ true }>
					{ renderSettings() }
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
									color: '#25D366',
								},
								{
									name: _x( 'WhatsApp Dark', 'background color name', 'jetpack' ),
									slug: 'whatsapp-dark',
									color: '#465B64',
								},
								{
									name: _x( 'WhatsApp Light', 'background color name', 'jetpack' ),
									slug: 'whatsapp-light',
									color: '#F4F4F4',
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
			</InspectorControls>

			<RichText
				placeholder={ buttonText.default }
				keepPlaceholderOnFocus={ true }
				value={ buttonText }
				onChange={ value => setAttributes( { buttonText: value } ) }
				withoutInteractiveFormatting
				allowedFormats={ [] }
				className="whatsapp-block__button"
				multiline="false"
				tagName="a"
				preserveWhiteSpace={ false }
				style={ {
					backgroundColor: backgroundColor,
				} }
			/>
		</div>
	);
}
