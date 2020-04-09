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
import defaultAttributes from './attributes';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import useConnectInstagram from './use-connect-instagram';
import ImageTransition from './image-transition';
import './editor.scss';

const InstagramGalleryEdit = props => {
	const { attributes, className, noticeOperations, noticeUI, setAttributes } = props;
	const { accessToken, align, columns, count, instagramUser, spacing } = attributes;

	const [ images, setImages ] = useState( [] );
	const [ isLoadingGallery, setIsLoadingGallery ] = useState( false );
	const { isConnecting, connectToService, disconnectFromService } = useConnectInstagram(
		setAttributes,
		setImages
	);

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
					<Button disabled={ isConnecting } isLarge isPrimary onClick={ connectToService }>
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
							<ImageTransition src={ image.url } attributes={ attributes } />
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
							<Button
								disabled={ isConnecting }
								isDestructive
								isLink
								onClick={ () => disconnectFromService( accessToken ) }
							>
								{ isConnecting
									? __( 'Disconnecting…', 'jetpack' )
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
