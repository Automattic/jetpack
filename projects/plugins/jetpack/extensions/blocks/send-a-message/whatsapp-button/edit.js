/**
 * External dependencies
 */
import classnames from 'classnames';
import { useEffect, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { ToolbarGroup } from '@wordpress/components';
import { BlockControls, InspectorControls, RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { countryCodes } from '../shared/countrycodes.js';
import WhatsAppButtonSettings from './settings';
import './view.scss';

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
		return classnames( className, colorClass ? 'is-color-' + colorClass : undefined );
	};

	return (
		<div className={ getBlockClassNames() }>
			{ ToolbarGroup && (
				<BlockControls>
					<WhatsAppButtonSettings context="toolbar" setAttributes={ setAttributes } attributes />
				</BlockControls>
			) }

			<InspectorControls>
				<WhatsAppButtonSettings context="inspector" setAttributes={ setAttributes } attributes />
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
				preserveWhiteSpace={ false }
				style={ {
					backgroundColor: backgroundColor,
					color: 'dark' === colorClass ? '#fff' : '#465B64',
				} }
			/>
		</div>
	);
}
