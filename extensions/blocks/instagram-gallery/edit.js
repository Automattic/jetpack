/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, isEmpty, isEqual, times } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	Notice,
	PanelBody,
	PanelRow,
	Placeholder,
	RangeControl,
	Spinner,
	withNotices,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import defaultAttributes from './attributes';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import useConnectInstagram from './use-connect-instagram';
import ImageTransition from './image-transition';
import './editor.scss';

const isCurrentUserConnectedToWpcom = get( window.Jetpack_Editor_Initial_State, [
	'jetpack',
	'is_current_user_connected',
] );

const MAX_IMAGE_COUNT = 30;

const InstagramGalleryEdit = props => {
	const {
		attributes,
		canUserManageOptions,
		className,
		isSelected,
		noticeOperations,
		noticeUI,
		setAttributes,
	} = props;
	const { accessToken, align, columns, count, instagramUser, spacing } = attributes;

	const [ images, setImages ] = useState( [] );
	const [ isLoadingGallery, setIsLoadingGallery ] = useState( false );
	const { isConnecting, connectToService, disconnectFromService } = useConnectInstagram(
		setAttributes,
		setImages,
		noticeOperations
	);
	const [ wpcomConnectUrl, setWpcomConnectUrl ] = useState();
	const [ isRequestingWpcomConnectUrl, setRequestingWpcomConnectUrl ] = useState( false );

	const unselectedCount = count > images.length ? images.length : count;

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes, setAttributes ] );

	useEffect( () => {
		if (
			! canUserManageOptions ||
			isCurrentUserConnectedToWpcom ||
			wpcomConnectUrl ||
			isRequestingWpcomConnectUrl
		) {
			return;
		}
		setRequestingWpcomConnectUrl( true );
		apiFetch( {
			path: addQueryArgs( '/jetpack/v4/connection/url', {
				from: 'jetpack-block-editor',
				redirect: window.location.href,
			} ),
		} ).then( connectUrl => {
			setWpcomConnectUrl( connectUrl );
			setRequestingWpcomConnectUrl( false );
		} );
	}, [ canUserManageOptions, isRequestingWpcomConnectUrl, wpcomConnectUrl ] );

	useEffect( () => {
		if ( ! accessToken ) {
			return;
		}

		noticeOperations.removeAllNotices();
		setIsLoadingGallery( true );

		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/instagram/gallery', {
				access_token: accessToken,
				count: MAX_IMAGE_COUNT,
			} ),
		} ).then( ( { external_name: externalName, images: imageList } ) => {
			setIsLoadingGallery( false );

			if ( isEmpty( imageList ) ) {
				noticeOperations.createErrorNotice(
					__( 'No images were found in your Instagram account.', 'jetpack' )
				);
				return;
			}

			setAttributes( { instagramUser: externalName } );
			setImages( imageList );
		} );
	}, [ accessToken, noticeOperations, setAttributes ] );

	const showPlaceholder = ! isLoadingGallery && ( ! accessToken || isEmpty( images ) );
	const showSidebar = ! showPlaceholder;
	const showLoadingSpinner = accessToken && isLoadingGallery && isEmpty( images );
	const showGallery = ! showPlaceholder && ! showLoadingSpinner;

	// `canUserManageOptions` is undefined while loading
	const isConnectToInstagramButtonDisabled =
		true !== canUserManageOptions || ! isCurrentUserConnectedToWpcom || isConnecting;
	const showLowerRolesNotice = false === canUserManageOptions;
	const showUserNeedsConnectionToWpcomNotice =
		canUserManageOptions && ! isCurrentUserConnectedToWpcom;
	const showDisconnectFromInstagramButton = canUserManageOptions || isCurrentUserConnectedToWpcom;

	const blockClasses = classnames( className, { [ `align${ align }` ]: align } );
	const gridClasses = classnames(
		'wp-block-jetpack-instagram-gallery__grid',
		`wp-block-jetpack-instagram-gallery__grid-columns-${ columns }`
	);
	const gridStyle = { gridGap: spacing };
	const photoStyle = { padding: spacing };

	useEffect( () => {
		noticeOperations.removeAllNotices();
		const accountImageTotal = images.length;

		if ( showSidebar && accountImageTotal < count ) {
			noticeOperations.createNotice( {
				status: 'info',
				content: __(
					sprintf(
						_n(
							'There is currently only %s post in your Instagram account',
							'There are currently only %s posts in your Instagram account',
							accountImageTotal,
							'jetpack'
						),
						accountImageTotal
					)
				),
				isDismissible: false,
			} );
		}
	}, [ count, images, noticeOperations, showSidebar ] );

	const renderImage = index => {
		if ( images[ index ] ) {
			const image = images[ index ];
			return (
				<ImageTransition
					alt={ image.title || image.url }
					src={ image.url }
					attributes={ attributes }
				/>
			);
		}

		return (
			<img
				alt={ __( 'Instagram Gallery placeholder', 'jetpack' ) }
				src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMyc2tBwAEOgG/c94mJwAAAABJRU5ErkJggg=="
			/>
		);
	};

	return (
		<div className={ blockClasses }>
			{ showPlaceholder && (
				<Placeholder
					icon="instagram"
					label={ __( 'Instagram Gallery', 'jetpack' ) }
					notices={ noticeUI }
				>
					<Button
						disabled={ isConnectToInstagramButtonDisabled }
						isLarge
						isPrimary
						onClick={ connectToService }
					>
						{ isConnecting
							? __( 'Connecting…', 'jetpack' )
							: __( 'Connect your Instagram account', 'jetpack' ) }
					</Button>

					{ showLowerRolesNotice && (
						<Notice isDismissible={ false } status="info">
							{ __( 'Only administrators can connect their accounts to Instagram.', 'jetpack' ) }
						</Notice>
					) }

					{ showUserNeedsConnectionToWpcomNotice && (
						<Notice isDismissible={ false } status="info">
							{ __(
								'To connect your Instagram account, you need to link your account to WordPress.com.',
								'jetpack'
							) }
							<br />
							<Button disabled={ isRequestingWpcomConnectUrl } href={ wpcomConnectUrl } isLink>
								{ __( 'Link your account to WordPress.com', 'jetpack' ) }
							</Button>
						</Notice>
					) }
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
					{ times( isSelected ? count : unselectedCount, index => (
						<span
							className={ classnames( 'wp-block-jetpack-instagram-gallery__grid-post' ) }
							key={ index }
							style={ photoStyle }
						>
							{ renderImage( index ) }
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
						{ showDisconnectFromInstagramButton && (
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
						) }
					</PanelBody>
					<PanelBody title={ __( 'Gallery Settings', 'jetpack' ) }>
						<div className="wp-block-jetpack-instagram-gallery__count-notice">{ noticeUI }</div>
						<RangeControl
							label={ __( 'Number of Posts', 'jetpack' ) }
							value={ count }
							onChange={ value => setAttributes( { count: value } ) }
							min={ 1 }
							max={ MAX_IMAGE_COUNT }
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

export default compose(
	withSelect( select => ( {
		// canUser returns undefined while loading, then true or false
		canUserManageOptions: select( 'core' ).canUser( 'update', 'settings' ),
	} ) ),
	withNotices
)( InstagramGalleryEdit );
