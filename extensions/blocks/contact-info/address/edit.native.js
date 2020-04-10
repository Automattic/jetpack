/**
 * External dependencies
 */
import { View } from 'react-native';
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { PlainText } from '@wordpress/block-editor';
import { ToggleControl } from '@wordpress/components';

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
		} = this.props;

		const externalLink = (
			<ToggleControl
				label={ __( 'Link address to Google Maps', 'jetpack' ) }
				checked={ linkToGoogleMaps }
				onChange={ newlinkToGoogleMaps => {
					setAttributes( { linkToGoogleMaps: newlinkToGoogleMaps } );
					onFocus();
				} }
			/>
		);

		return (
			<View>
				<Fragment>
					<PlainText
						value={ address }
						placeholder={ __( 'Street Address', 'jetpack' ) }
						aria-label={ __( 'Street Address', 'jetpack' ) }
						onChange={ newAddress => setAttributes( { address: newAddress } ) }
						onKeyDown={ this.preventEnterKey }
						onFocus={ onFocus }
					/>
					<PlainText
						value={ addressLine2 }
						placeholder={ __( 'Address Line 2', 'jetpack' ) }
						aria-label={ __( 'Address Line 2', 'jetpack' ) }
						onChange={ newAddressLine2 => setAttributes( { addressLine2: newAddressLine2 } ) }
						onKeyDown={ this.preventEnterKey }
						onFocus={ onFocus }
					/>
					<PlainText
						value={ addressLine3 }
						placeholder={ __( 'Address Line 3', 'jetpack' ) }
						aria-label={ __( 'Address Line 3', 'jetpack' ) }
						onChange={ newAddressLine3 => setAttributes( { addressLine3: newAddressLine3 } ) }
						onKeyDown={ this.preventEnterKey }
						onFocus={ onFocus }
					/>
					<PlainText
						value={ city }
						placeholder={ __( 'City', 'jetpack' ) }
						aria-label={ __( 'City', 'jetpack' ) }
						onChange={ newCity => setAttributes( { city: newCity } ) }
						onKeyDown={ this.preventEnterKey }
						onFocus={ onFocus }
					/>
					<PlainText
						value={ region }
						placeholder={ __( 'State/Province/Region', 'jetpack' ) }
						aria-label={ __( 'State/Province/Region', 'jetpack' ) }
						onChange={ newRegion => setAttributes( { region: newRegion } ) }
						onKeyDown={ this.preventEnterKey }
						onFocus={ onFocus }
					/>
					<PlainText
						value={ postal }
						placeholder={ __( 'Postal/Zip Code', 'jetpack' ) }
						aria-label={ __( 'Postal/Zip Code', 'jetpack' ) }
						onChange={ newPostal => setAttributes( { postal: newPostal } ) }
						onKeyDown={ this.preventEnterKey }
						onFocus={ onFocus }
					/>
					<PlainText
						value={ country }
						placeholder={ __( 'Country', 'jetpack' ) }
						aria-label={ __( 'Country', 'jetpack' ) }
						onChange={ newCountry => setAttributes( { country: newCountry } ) }
						onKeyDown={ this.preventEnterKey }
						onFocus={ onFocus }
					/>
					{ externalLink }
				</Fragment>
			</View>
		);
	}
}

export default AddressEdit;
