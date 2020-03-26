/**
 * External dependencies
 */
import { debounce, isEmpty, isEqual } from 'lodash';

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
	Spinner,
	withNotices,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import defaultAttributes from './attributes';
import { getGalleryCssAttributes, getScreenCenterSpecs } from './utils';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import './editor.scss';

export function InstagramGalleryEdit( props ) {
	const { attributes, className, noticeOperations, noticeUI, setAttributes } = props;
	const { accessToken, columns, count, images, instagramUser, spacing } = attributes;

	const [ isConnectingToInstagram, setIsConnectingToInstagram ] = useState( false );
	const [ isLoadingGallery, setIsLoadingGallery ] = useState( false );

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes ] );

	useEffect( () => {
		if ( ! accessToken ) {
			return;
		}
		noticeOperations.removeAllNotices();
		if ( ! isEmpty( images ) ) {
			setIsLoadingGallery( true );
		}
		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/instagram/gallery', {
				access_token: accessToken,
				count,
			} ),
		} ).then( response => {
			setIsLoadingGallery( false );

			if ( isEmpty( response.images ) ) {
				noticeOperations.createErrorNotice(
					__( 'No images were found in your Instagram account.', 'jetpack' )
				);
				return;
			}

			setAttributes( { images: response.images, instagramUser: response.external_name } );
		} );
	}, [ accessToken, count ] );

	const connectToInstagram = () => {
		setIsConnectingToInstagram( true );
		apiFetch( { path: '/wpcom/v2/instagram/connect-url' } ).then( connectUrl => {
			window.open(
				connectUrl,
				'_blank',
				'toolbar=0,location=0,menubar=0,' + getScreenCenterSpecs( 700, 700 )
			);
			window.onmessage = ( { data } ) => {
				setIsConnectingToInstagram( false );
				if ( ! data.keyring_id ) {
					return;
				}
				setAttributes( { accessToken: data.keyring_id.toString() } );
			};
		} );
	};

	const disconnectFromInstagram = () => {
		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/instagram/delete-access-token', {
				access_token: accessToken,
			} ),
			method: 'DELETE',
		} ).then( responseCode => {
			if ( 200 === responseCode ) {
				setAttributes( {
					accessToken: undefined,
					images: [],
				} );
			}
		} );
	};

	const debouncedSetNumberOfPosts = debounce( value => setAttributes( { count: value } ), 500 );

	const showPlaceholder = ! accessToken || isEmpty( images );
	const showSidebar = ! showPlaceholder;
	const showLoadingSpinner = accessToken && isLoadingGallery;
	const showGallery = ! showPlaceholder && ! isLoadingGallery;

	const { gridClasses, gridStyle, photoStyle } = getGalleryCssAttributes( columns, spacing );

	return (
		<div className={ className }>
			{ showPlaceholder && (
				<Placeholder
					icon="instagram"
					label={ __( 'Instagram Gallery', 'jetpack' ) }
					notices={ noticeUI }
				>
					<Button
						disabled={ isConnectingToInstagram }
						isLarge
						isPrimary
						onClick={ connectToInstagram }
					>
						{ isConnectingToInstagram
							? __( 'Connecting…', 'jetpack' )
							: __( 'Connect your Instagram account', 'jetpack' ) }
					</Button>
				</Placeholder>
			) }

			{ showLoadingSpinner && (
				<div className="wp-block-embed is-loading">
					<Spinner />
					<p>{ __( 'Embedding…', 'jetpack' ) }</p>
				</div>
			) }

			{ showGallery && (
				<div className={ gridClasses } style={ gridStyle }>
					{ images.map( image => (
						<span
							className="wp-block-jetpack-instagram-gallery__grid-post"
							key={ image.title || image.link }
							style={ photoStyle }
						>
							<img alt={ image.title || image.url } src={ image.url } />
						</span>
					) ) }
				</div>
			) }

			{ showSidebar && (
				<InspectorControls>
					<PanelBody title={ __( 'Account Settings', 'jetpack' ) }>
						<PanelRow>
							<span>{ __( 'Account', 'jetpack' ) }</span>
							<ExternalLink href={ `https://www.instagram.com/${ instagramUser }/` }>
								@{ instagramUser }
							</ExternalLink>
						</PanelRow>
						<PanelRow>
							<Button isDestructive isLink onClick={ disconnectFromInstagram }>
								{ __( 'Disconnect your account', 'jetpack' ) }
							</Button>
						</PanelRow>
					</PanelBody>
					<PanelBody title={ __( 'Gallery Settings', 'jetpack' ) }>
						<RangeControl
							label={ __( 'Number of Posts', 'jetpack' ) }
							value={ count }
							onChange={ debouncedSetNumberOfPosts }
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
							value={ spacing }
							onChange={ value => setAttributes( { spacing: value } ) }
							min={ 0 }
							max={ 50 }
						/>
					</PanelBody>
				</InspectorControls>
			) }
		</div>
	);
}

export default withNotices( InstagramGalleryEdit );
