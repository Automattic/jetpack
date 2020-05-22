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
	Icon,
	PanelBody,
	ToolbarGroup,
	Dropdown,
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
		if ( undefined !== countryCode ) {
			return;
		}

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
				icon={ <Icon icon="edit" /> }
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
				tagName="a"
				style={ {
					backgroundColor: backgroundColor,
				} }
			/>
		</div>
	);
}
