/**
 * External dependencies
 */
import classnames from 'classnames';
import { debounce, isEmpty, isEqual, take, times } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { InspectorControls } from '@wordpress/block-editor';
import {
	Animate,
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
import PopupMonitor from 'lib/popup-monitor';
import defaultAttributes from './attributes';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import './editor.scss';

const InstagramGalleryEdit = props => {
	const { attributes, className, noticeOperations, noticeUI, setAttributes } = props;
	const { accessToken, align, columns, count, instagramUser, spacing } = attributes;

	const [ isConnecting, setIsConnecting ] = useState( false );
	const [ images, setImages ] = useState( [] );
	const [ isLoadingGallery, setIsLoadingGallery ] = useState( false );

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes, setAttributes ] );

	useEffect( () => {
		if ( ! accessToken ) {
			return;
		}

		noticeOperations.removeAllNotices();
		setIsLoadingGallery( true );

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

			setAttributes( { instagramUser: response.external_name } );
			setImages( response.images );
		} );
	}, [ accessToken, count, noticeOperations, setAttributes ] );

	const connectToInstagram = () => {
		setIsConnecting( true );
		apiFetch( { path: '/wpcom/v2/instagram/connect-url' } ).then( connectUrl => {
			const popupMonitor = new PopupMonitor();

			popupMonitor.open(
				connectUrl,
				'connect-to-instagram-popup',
				'toolbar=0,location=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 700, 700 )
			);

			popupMonitor.on( 'message', ( { keyring_id } ) => {
				setIsConnecting( false );
				if ( keyring_id ) {
					setAttributes( { accessToken: keyring_id.toString() } );
				}
			} );

			popupMonitor.on( 'close', name => {
				if ( 'connect-to-instagram-popup' === name ) {
					setIsConnecting( false );
				}
			} );
		} );
	};

	const disconnectFromInstagram = () => {
		setIsConnecting( true );
		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/instagram/delete-access-token', {
				access_token: accessToken,
			} ),
			method: 'DELETE',
		} ).then( responseCode => {
			setIsConnecting( false );
			if ( 200 === responseCode ) {
				setAttributes( { accessToken: undefined } );
				setImages( [] );
			}
		} );
	};

	const debouncedSetNumberOfPosts = debounce( value => {
		if ( value < images.length ) {
			setImages( take( images, value ) );
		}
		setAttributes( { count: value } );
	}, 500 );

	const showPlaceholder = ! isLoadingGallery && ( ! accessToken || isEmpty( images ) );
	const showSidebar = ! showPlaceholder;
	const showLoadingSpinner = accessToken && isLoadingGallery && isEmpty( images );
	const showGallery = ! showPlaceholder && ! showLoadingSpinner;

	const blockClasses = classnames( className, { [ `align${ align }` ]: align } );
	const gridClasses = classnames(
		'wp-block-jetpack-instagram-gallery__grid',
		`wp-block-jetpack-instagram-gallery__grid-columns-${ columns }`
	);
	const gridStyle = { gridGap: spacing };
	const photoStyle = { padding: spacing };

	return (
		<div className={ blockClasses }>
			{ showPlaceholder && (
				<Placeholder
					icon="instagram"
					label={ __( 'Instagram Gallery', 'jetpack' ) }
					notices={ noticeUI }
				>
					<Button disabled={ isConnecting } isLarge isPrimary onClick={ connectToInstagram }>
						{ isConnecting
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
					{ isLoadingGallery && count > images.length && (
						<Animate type="loading">
							{ ( { className: animateClasses } ) =>
								times( count - images.length, index => (
									<span
										className={ classnames(
											'wp-block-jetpack-instagram-gallery__grid-post',
											animateClasses
										) }
										key={ `instagram-gallery-placeholder-${ index }` }
										style={ photoStyle }
									>
										<img
											alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
											src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMyc2tBwAEOgG/c94mJwAAAABJRU5ErkJggg=="
										/>
									</span>
								) )
							}
						</Animate>
					) }
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
							<Button
								disabled={ isConnecting }
								isDestructive
								isLink
								onClick={ disconnectFromInstagram }
							>
								{ isConnecting
									? __( 'Disonnecting…', 'jetpack' )
									: __( 'Disconnect your account', 'jetpack' ) }
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
};

export default withNotices( InstagramGalleryEdit );
