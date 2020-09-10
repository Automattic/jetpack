/**
 * External dependencies
 */
import { View } from 'react-native';
import { __ } from '@wordpress/i18n';
import { InspectorControls, PlainText } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import stylesEditor from '../editor.scss';
import styles from '../style.scss';

class AddressEdit extends Component {
	constructor( ...args ) {
		super( ...args );

		this.preventEnterKey = this.preventEnterKey.bind( this );
	}

	preventEnterKey( event ) {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			return;
		}
	}

	render() {
		const {
			attributes: {
				address,
				addressLine2,
				addressLine3,
				city,
				region,
				postal,
				country,
				linkToGoogleMaps,
			},
			setAttributes,
			onFocus,
			getStylesFromColorScheme,
		} = this.props;

		const externalLink = (
			<InspectorControls>
				<PanelBody title={ __( 'Contact Info Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Link address to Google Maps', 'jetpack' ) }
						checked={ linkToGoogleMaps }
						onChange={ newlinkToGoogleMaps => {
							setAttributes( { linkToGoogleMaps: newlinkToGoogleMaps } );
							onFocus();
						} }
					/>
				</PanelBody>
			</InspectorControls>
		);

		const textData = [
			{
				value: address,
				placeholder: __( 'Street Address', 'jetpack' ),
				onChange: newAddress => setAttributes( { address: newAddress } ),
			},
			{
				value: addressLine2,
				placeholder: __( 'Address Line 2', 'jetpack' ),
				onChange: newAddressLine2 => setAttributes( { addressLine2: newAddressLine2 } ),
			},
			{
				value: addressLine3,
				placeholder: __( 'Address Line 3', 'jetpack' ),
				onChange: newAddressLine3 => setAttributes( { addressLine3: newAddressLine3 } ),
			},
			{
				value: city,
				placeholder: __( 'City', 'jetpack' ),
				onChange: newCity => setAttributes( { city: newCity } ),
			},
			{
				value: region,
				placeholder: __( 'State/Province/Region', 'jetpack' ),
				onChange: newRegion => setAttributes( { region: newRegion } ),
			},
			{
				value: postal,
				placeholder: __( 'Postal/Zip Code', 'jetpack' ),
				onChange: newPostal => setAttributes( { postal: newPostal } ),
			},
			{
				value: country,
				placeholder: __( 'Country', 'jetpack' ),
				onChange: newCountry => setAttributes( { country: newCountry } ),
			},
		];
		const placeholderTextColor = getStylesFromColorScheme(
			styles.placeholder.color,
			styles.placeholderDark.color
		);
		const textInput = ( value, placeholder, onChange ) => (
			<PlainText
				style={ stylesEditor.blockEditorPlainText }
				value={ value }
				placeholder={ placeholder }
				placeholderTextColor={ placeholderTextColor }
				aria-label={ placeholder }
				onChange={ onChange }
				onKeyDown={ this.preventEnterKey }
				onFocus={ onFocus }
			/>
		);
		return (
			<View>
				<Fragment>
					{ textData.map( data => textInput( data.value, data.placeholder, data.onChange ) ) }
				</Fragment>
				{ externalLink }
			</View>
		);
	}
}

export default withPreferredColorScheme( AddressEdit );
