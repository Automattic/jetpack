/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	PanelBody,
	PanelRow,
	Placeholder,
	RangeControl,
	TextControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import defaultAttributes from './attributes';
import { getGalleryCssAttributes } from './utils';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import './editor.scss';

export default function InstagramGalleryEdit( props ) {
	const { attributes, className, setAttributes } = props;
	const { accessToken, columns, images, photosPadding, photosToShow } = attributes;
	const [ accessTokenField, setAccessTokenField ] = useState( '' );
	const [ instagramUsername, setInstagramUsername ] = useState();

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes ] );

	useEffect( () => {
		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/instagram-gallery', {
				access_token: accessToken,
				count: photosToShow,
			} ),
		} ).then( response => {
			setInstagramUsername( response.external_name );
			setAttributes( { images: response.images } );
		} );
	}, [ accessToken, photosToShow ] );

	const saveUsername = event => {
		event.preventDefault();
		setAttributes( { accessToken: accessTokenField.trim() } );
	};

	const { gridClasses, gridStyle, photoStyle } = getGalleryCssAttributes( columns, photosPadding );

	return (
		<div className={ className }>
			{ ! accessToken && (
				<Placeholder icon="instagram" label={ __( 'Instagram Gallery', 'jetpack' ) }>
					<Button disabled isLarge isPrimary>
						{ __( 'Connect your Instagram account', 'jetpack' ) }
					</Button>
					<form onSubmit={ saveUsername }>
						<input
							className="components-placeholder__input"
							onChange={ event => setAccessTokenField( event.target.value.trim() ) }
							placeholder={ __( 'Enter your Instagram Keyring access token', 'jetpack' ) }
							type="text"
							value={ accessTokenField }
						/>
						<div>
							<Button disabled={ ! accessTokenField } isDefault isLarge isSecondary type="submit">
								{ __( 'Submit', 'jetpack' ) }
							</Button>
						</div>
					</form>
				</Placeholder>
			) }

			{ accessToken && (
				<>
					<div className={ gridClasses } style={ gridStyle }>
						{ images &&
							images.map( image => (
								<span
									className="wp-block-jetpack-instagram-gallery__grid-post"
									key={ image.title || image.link }
									style={ photoStyle }
								>
									<img alt={ image.title || image.url } src={ image.url } />
								</span>
							) ) }
					</div>
					<InspectorControls>
						<PanelBody title={ __( 'Settings', 'jetpack' ) }>
							<PanelRow>
								<span>{ __( 'Account', 'jetpack' ) }</span>
								<ExternalLink href={ `https://www.instagram.com/${ instagramUsername } /` }>
									@{ instagramUsername }
								</ExternalLink>
							</PanelRow>
							<PanelRow>
								<Button isDestructive isLink>
									{ __( 'Disconnect your account', 'jetpack' ) }
								</Button>
							</PanelRow>
							<PanelRow>
								<TextControl
									help="FOR TESTING PURPOSES ONLY"
									label={ __( 'Instagram Keyring Access Token', 'jetpack' ) }
									value={ accessToken }
									onChange={ value => setAttributes( { accessToken: value } ) }
								/>
							</PanelRow>
							<RangeControl
								label={ __( 'Number of Posts', 'jetpack' ) }
								value={ photosToShow }
								onChange={ value => setAttributes( { photosToShow: value } ) }
								min={ 1 }
								max={ 30 }
							/>
							<RangeControl
								label={ __( 'Number of Columns', 'jetpack' ) }
								value={ columns }
								onChange={ value => setAttributes( { columns: value } ) }
								min={ 1 }
								max={ 6 }
							/>
							<RangeControl
								label={ __( 'Image Spacing (px)', 'jetpack' ) }
								value={ photosPadding }
								onChange={ value => setAttributes( { photosPadding: value } ) }
								min={ 0 }
								max={ 50 }
							/>
						</PanelBody>
					</InspectorControls>
				</>
			) }
		</div>
	);
}
