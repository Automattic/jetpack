import { BlockControls, InspectorControls, RichText } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';
import clsx from 'clsx';
import { countryCodes } from '../shared/countrycodes.js';
import WhatsAppButtonConfiguration from './configuration';
import '../view.scss';

export default function WhatsAppButtonEdit( { attributes, setAttributes, className, clientId } ) {
	const { countryCode, buttonText, colorClass, backgroundColor } = attributes;

	const { selectBlock } = useDispatch( 'core/block-editor' );

	const getCountryCode = useCallback( async () => {
		setAttributes( { countryCode: '1' } );

		const geoFetch = await fetch( 'https://public-api.wordpress.com/geo/' )
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
				if ( item.code === geo.country_short ) {
					setAttributes( { countryCode: item.value } );
				}
			} );
		}
	}, [ setAttributes ] );

	useEffect( () => {
		if ( undefined === countryCode ) {
			getCountryCode();
			selectBlock( clientId );
		}
	}, [ clientId, countryCode, getCountryCode, selectBlock ] );

	const getBlockClassNames = () => {
		return clsx( className, colorClass ? 'is-color-' + colorClass : undefined );
	};

	return (
		<div className={ getBlockClassNames() }>
			<BlockControls>
				<WhatsAppButtonConfiguration
					context="toolbar"
					setAttributes={ setAttributes }
					attributes={ attributes }
				/>
			</BlockControls>

			<InspectorControls>
				<WhatsAppButtonConfiguration
					context="inspector"
					setAttributes={ setAttributes }
					attributes={ attributes }
				/>
			</InspectorControls>

			<RichText
				placeholder={ buttonText.default }
				value={ buttonText }
				onChange={ value => setAttributes( { buttonText: value } ) }
				withoutInteractiveFormatting
				allowedFormats={ [] }
				className="whatsapp-block__button"
				tagName="a"
				preserveWhiteSpace={ false }
				style={ {
					backgroundColor: backgroundColor,
					color: 'dark' === colorClass ? '#fff' : '#465B64',
				} }
			/>
		</div>
	);
}
