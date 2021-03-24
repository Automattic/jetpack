/**
 * External dependencies
 */
import classnames from 'classnames';
import { find, isEmpty, isEqual, map, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { Button, Placeholder, RadioControl, Spinner, withNotices } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import defaultAttributes from './attributes';
import { NEW_INSTAGRAM_CONNECTION } from './constants';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import useConnectInstagram from './use-connect-instagram';
import useConnectWpcom from './use-connect-wpcom';
import useInstagramGallery from './use-instagram-gallery';
import ImageTransition from './image-transition';
import isCurrentUserConnected from '../../shared/is-current-user-connected';
import InstagramGalleryInspectorControls from './controls';
import './editor.scss';

const InstagramGalleryEdit = props => {
	const { attributes, className, isSelected, noticeOperations, noticeUI, setAttributes } = props;
	const { accessToken, align, columns, count, isStackedOnMobile, spacing } = attributes;

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes, setAttributes ] );

	const [ selectedAccount, setSelectedAccount ] = useState( accessToken );
	const { isRequestingWpcomConnectUrl, wpcomConnectUrl } = useConnectWpcom();
	const { images, isLoadingGallery, setImages } = useInstagramGallery( {
		accessToken,
		noticeOperations,
		setAttributes,
		setSelectedAccount,
	} );
	const {
		connectToService,
		disconnectFromService,
		isConnecting,
		isRequestingUserConnections,
		userConnections,
	} = useConnectInstagram( {
		accessToken,
		noticeOperations,
		selectedAccount,
		setAttributes,
		setImages,
		setSelectedAccount,
	} );

	const currentUserConnected = isCurrentUserConnected();
	const unselectedCount = count > images.length ? images.length : count;

	const showPlaceholder = ! isLoadingGallery && ( ! accessToken || isEmpty( images ) );
	const showSidebar = ! showPlaceholder;
	const showLoadingSpinner = accessToken && isLoadingGallery && isEmpty( images );
	const showGallery = ! showPlaceholder && ! showLoadingSpinner;

	const blockClasses = classnames( className, { [ `align${ align }` ]: align } );
	const gridClasses = classnames(
		'wp-block-jetpack-instagram-gallery__grid',
		`wp-block-jetpack-instagram-gallery__grid-columns-${ columns }`,
		{ 'is-stacked-on-mobile': isStackedOnMobile }
	);
	const gridStyle = { gridGap: spacing };
	const photoStyle = { padding: spacing };

	const shouldRenderSidebarNotice = () =>
		showSidebar && ! showLoadingSpinner && images.length < count;

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
				alt={ __( 'Latest Instagram Posts placeholder', 'jetpack' ) }
				src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMyc2tBwAEOgG/c94mJwAAAABJRU5ErkJggg=="
			/>
		);
	};

	const connectBlockToInstagram = () => {
		if ( selectedAccount && NEW_INSTAGRAM_CONNECTION !== selectedAccount ) {
			setAttributes( {
				accessToken: selectedAccount,
				instagramUser: find( userConnections, { token: selectedAccount } ).username,
			} );
			return;
		}
		connectToService();
	};

	const renderPlaceholderInstructions = () => {
		if ( ! currentUserConnected ) {
			return __( "First, you'll need to connect to WordPress.com.", 'jetpack' );
		}
		if ( ! isRequestingUserConnections && ! userConnections.length ) {
			return __( 'Connect to Instagram to start sharing your images.', 'jetpack' );
		}
	};

	const renderInstagramConnection = () => {
		const hasUserConnections = userConnections.length > 0;
		const radioOptions = [
			...map( userConnections, connection => ( {
				label: `@${ connection.username }`,
				value: connection.token,
			} ) ),
			{
				label: __( 'Add a new account', 'jetpack' ),
				value: NEW_INSTAGRAM_CONNECTION,
			},
		];
		const isButtonDisabled =
			isConnecting || isRequestingUserConnections || ( hasUserConnections && ! selectedAccount );

		return (
			<div>
				{ hasUserConnections && (
					<RadioControl
						label={ __( 'Select your Instagram account:', 'jetpack' ) }
						onChange={ value => setSelectedAccount( value ) }
						options={ radioOptions }
						selected={ selectedAccount }
					/>
				) }
				{ NEW_INSTAGRAM_CONNECTION === selectedAccount && (
					<p className="wp-block-jetpack-instagram-gallery__new-account-instructions">
						{ __(
							'If you are currently logged in to Instagram on this device, you might need to log out of it first.',
							'jetpack'
						) }
					</p>
				) }
				<Button disabled={ isButtonDisabled } isPrimary onClick={ connectBlockToInstagram }>
					{ isConnecting && __( 'Connecting…', 'jetpack' ) }
					{ isRequestingUserConnections && __( 'Loading your connections…', 'jetpack' ) }
					{ ! isConnecting &&
						! isRequestingUserConnections &&
						__( 'Connect to Instagram', 'jetpack' ) }
				</Button>
			</div>
		);
	};

	return (
		<div className={ blockClasses }>
			{ showPlaceholder && (
				<Placeholder
					icon="instagram"
					instructions={ renderPlaceholderInstructions() }
					label={ __( 'Latest Instagram Posts', 'jetpack' ) }
					notices={ noticeUI }
				>
					{ currentUserConnected ? (
						renderInstagramConnection()
					) : (
						<Button
							disabled={ isRequestingWpcomConnectUrl || ! wpcomConnectUrl }
							href={ wpcomConnectUrl }
							isPrimary
						>
							{ __( 'Connect to WordPress.com', 'jetpack' ) }
						</Button>
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
					<InstagramGalleryInspectorControls
						accountImageTotal={ images.length }
						attributes={ attributes }
						currentUserConnected={ currentUserConnected }
						disconnectFromService={ disconnectFromService }
						shouldRenderSidebarNotice={ shouldRenderSidebarNotice() }
						setAttributes={ setAttributes }
					/>
				</InspectorControls>
			) }
		</div>
	);
};

export default withNotices( InstagramGalleryEdit );
