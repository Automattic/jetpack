import { PlainText, useBlockProps } from '@wordpress/block-editor';
import { ToggleControl } from '@wordpress/components';
import { useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import save from './save';

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
	} = props;
	const hasContent = [ address, addressLine2, addressLine3, city, region, postal, country ].some(
		value => value !== ''
	);
	const classNames = clsx( {
		'jetpack-address-block': true,
		'is-selected': isSelected,
	} );

	const preventEnterKey = useCallback( event => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
		}
	}, [] );
	const blockProps = useBlockProps( {
		className: classNames,
	} );

	const externalLink = (
		<ToggleControl
			__nextHasNoMarginBottom={ true }
			label={ __( 'Link address to Google Maps', 'jetpack' ) }
			checked={ linkToGoogleMaps }
			onChange={ newlinkToGoogleMaps => setAttributes( { linkToGoogleMaps: newlinkToGoogleMaps } ) }
		/>
	);

	return (
		<div { ...blockProps }>
			{ ! isSelected && hasContent && save( props ) }
			{ ( isSelected || ! hasContent ) && (
				<Fragment>
					<PlainText
						value={ address }
						placeholder={ __( 'Street Address', 'jetpack' ) }
						aria-label={ __( 'Street Address', 'jetpack' ) }
						onChange={ newAddress => setAttributes( { address: newAddress } ) }
						onKeyDown={ preventEnterKey }
					/>
					<PlainText
						value={ addressLine2 }
						placeholder={ __( 'Address Line 2', 'jetpack' ) }
						aria-label={ __( 'Address Line 2', 'jetpack' ) }
						onChange={ newAddressLine2 => setAttributes( { addressLine2: newAddressLine2 } ) }
						onKeyDown={ preventEnterKey }
					/>
					<PlainText
						value={ addressLine3 }
						placeholder={ __( 'Address Line 3', 'jetpack' ) }
						aria-label={ __( 'Address Line 3', 'jetpack' ) }
						onChange={ newAddressLine3 => setAttributes( { addressLine3: newAddressLine3 } ) }
						onKeyDown={ preventEnterKey }
					/>
					<PlainText
						value={ city }
						placeholder={ __( 'City', 'jetpack' ) }
						aria-label={ __( 'City', 'jetpack' ) }
						onChange={ newCity => setAttributes( { city: newCity } ) }
						onKeyDown={ preventEnterKey }
					/>
					<PlainText
						value={ region }
						placeholder={ __( 'State/Province/Region', 'jetpack' ) }
						aria-label={ __( 'State/Province/Region', 'jetpack' ) }
						onChange={ newRegion => setAttributes( { region: newRegion } ) }
						onKeyDown={ preventEnterKey }
					/>
					<PlainText
						value={ postal }
						placeholder={ __( 'Postal/Zip Code', 'jetpack' ) }
						aria-label={ __( 'Postal/Zip Code', 'jetpack' ) }
						onChange={ newPostal => setAttributes( { postal: newPostal } ) }
						onKeyDown={ preventEnterKey }
					/>
					<PlainText
						value={ country }
						placeholder={ __( 'Country', 'jetpack' ) }
						aria-label={ __( 'Country', 'jetpack' ) }
						onChange={ newCountry => setAttributes( { country: newCountry } ) }
						onKeyDown={ preventEnterKey }
					/>
					{ externalLink }
				</Fragment>
			) }
		</div>
	);
};

export default AddressEdit;
