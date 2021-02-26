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
				<PanelBody title={ __( 'Address Settings', 'jetpack' ) }>
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
				key: 'address',
			},
			{
				value: addressLine2,
				placeholder: __( 'Address Line 2', 'jetpack' ),
				key: 'addressLine2',
			},
			{
				value: addressLine3,
				placeholder: __( 'Address Line 3', 'jetpack' ),
				key: 'addressLine3',
			},
			{
				value: city,
				placeholder: __( 'City', 'jetpack' ),
				key: 'city',
			},
			{
				value: region,
				placeholder: __( 'State/Province/Region', 'jetpack' ),
				key: 'region',
			},
			{
				value: postal,
				placeholder: __( 'Postal/Zip Code', 'jetpack' ),
				key: 'postal',
			},
			{
				value: country,
				placeholder: __( 'Country', 'jetpack' ),
				key: 'country',
			},
		];
		const { color: placeholderTextColor } = getStylesFromColorScheme(
			styles.placeholder,
			styles.placeholderDark
		);
		const textColors = getStylesFromColorScheme(
			styles.blockEditorPlainText,
			styles.blockEditorPlainTextDark
		);
		const textInput = ( value, placeholder, key ) => (
			<PlainText
				style={ {
					...textColors,
					...stylesEditor.addressPadding,
				} }
				value={ value }
				placeholder={ placeholder }
				placeholderTextColor={ placeholderTextColor }
				aria-label={ placeholder }
				onChange={ newValue => setAttributes( { [ key ]: newValue } ) }
				onKeyDown={ this.preventEnterKey }
				onFocus={ onFocus }
				key={ `address-child-${ key }` }
			/>
		);
		return (
			<View>
				<Fragment>
					{ textData.map( data => textInput( data.value, data.placeholder, data.key ) ) }
				</Fragment>
				{ externalLink }
			</View>
		);
	}
}

export default withPreferredColorScheme( AddressEdit );
