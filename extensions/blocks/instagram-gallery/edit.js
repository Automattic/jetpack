/**
 * External dependencies
 */
import classnames from 'classnames';
import { find, isEmpty, isEqual, map, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	Notice,
	PanelBody,
	PanelRow,
	Placeholder,
	RadioControl,
	RangeControl,
	Spinner,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import defaultAttributes from './attributes';
import { MAX_IMAGE_COUNT, NEW_INSTAGRAM_CONNECTION } from './constants';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import useConnectInstagram from './use-connect-instagram';
import useConnectWpcom from './use-connect-wpcom';
import useInstagramGallery from './use-instagram-gallery';
import ImageTransition from './image-transition';
import isCurrentUserConnected from '../../shared/is-current-user-connected';
import './editor.scss';

const InstagramGalleryEdit = props => {
	const { attributes, className, isSelected, noticeOperations, noticeUI, setAttributes } = props;
	const {
		accessToken,
		align,
		columns,
		count,
		instagramUser,
		isStackedOnMobile,
		spacing,
	} = attributes;

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

	const renderSidebarNotice = () => {
		const accountImageTotal = images.length;

		if ( showSidebar && ! showLoadingSpinner && accountImageTotal < count ) {
			const noticeContent = accountImageTotal
				? sprintf(
						_n(
							'There is currently only %s post in your Instagram account.',
							'There are currently only %s posts in your Instagram account.',
							accountImageTotal,
							'jetpack'
						),
						accountImageTotal
				  )
				: __( 'There are currently no posts in your Instagram account.', 'jetpack' );
			return (
				<div className="wp-block-jetpack-instagram-gallery__count-notice">
					<Notice isDismissible={ false } status="info">
						{ noticeContent }
					</Notice>
				</div>
			);
		}
	};

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
				<Button disabled={ isButtonDisabled } isLarge isPrimary onClick={ connectBlockToInstagram }>
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
							isLarge
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
					<PanelBody title={ __( 'Account Settings', 'jetpack' ) }>
						<PanelRow>
							<span>{ __( 'Account', 'jetpack' ) }</span>
							<ExternalLink href={ `https://www.instagram.com/${ instagramUser }/` }>
								@{ instagramUser }
							</ExternalLink>
						</PanelRow>
						{ currentUserConnected && (
							<PanelRow>
								<Button isDestructive isLink onClick={ () => disconnectFromService( accessToken ) }>
									{ __( 'Disconnect your account', 'jetpack' ) }
								</Button>
							</PanelRow>
						) }
					</PanelBody>
					<PanelBody title={ __( 'Display Settings', 'jetpack' ) }>
						{ renderSidebarNotice() }
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
						<ToggleControl
							label={ __( 'Stack on mobile', 'jetpack' ) }
							checked={ isStackedOnMobile }
							onChange={ () =>
								setAttributes( {
									isStackedOnMobile: ! isStackedOnMobile,
								} )
							}
						/>
					</PanelBody>
				</InspectorControls>
			) }
		</div>
	);
};

export default withNotices( InstagramGalleryEdit );
