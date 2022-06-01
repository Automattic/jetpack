import { InspectorControls, PlainText } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { View } from 'react-native';
import stylesEditor from '../editor.scss';
import styles from '../style.scss';

const AddressEdit = props => {
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
		isSelected,
		setAttributes,
		onFocus,
	} = props;

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

	/* eslint-disable-next-line react-hooks/rules-of-hooks */
	const textInputRefs = textData.map( () => useRef( null ) );
	const [ textInputsSelected, setTextInputsSelected ] = useState( textData.map( () => false ) );
	useEffect( () => {
		if ( isSelected ) {
			return;
		}

		textInputRefs.forEach( ref => ref?.current?.blur() );
	}, [ isSelected, textInputRefs ] );

	const preventEnterKey = event => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
		}
	};

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

	const { color: placeholderTextColor } = usePreferredColorSchemeStyle(
		styles.placeholder,
		styles.placeholderDark
	);
	const textColors = usePreferredColorSchemeStyle(
		styles.blockEditorPlainText,
		styles.blockEditorPlainTextDark
	);

	const onFocusTextInput = index => () => {
		if ( index < textInputsSelected.length ) {
			const newTextInputsSelected = [ ...textInputsSelected ];
			newTextInputsSelected[ index ] = true;
			setTextInputsSelected( newTextInputsSelected );
		}
		onFocus();
	};

	const onBlurTextInput = index => () => {
		if ( index >= textInputsSelected.length ) {
			return;
		}

		const newTextInputsSelected = [ ...textInputsSelected ];
		newTextInputsSelected[ index ] = false;
		setTextInputsSelected( newTextInputsSelected );
	};

	const textInput = ( value, placeholder, key, index ) => (
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
			onKeyDown={ preventEnterKey }
			onBlur={ onBlurTextInput( index ) }
			onFocus={ onFocusTextInput( index ) }
			key={ `address-child-${ key }` }
			ref={ textInputRefs[ index ] }
		/>
	);

	return (
		<View>
			{ textData.map( ( data, index ) =>
				textInput( data.value, data.placeholder, data.key, index )
			) }
			{ externalLink }
		</View>
	);
};

export default AddressEdit;
