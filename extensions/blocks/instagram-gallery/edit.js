/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty, isEqual, times } from 'lodash';

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
	RangeControl,
	Spinner,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import defaultAttributes from './attributes';
import { IS_CURRENT_USER_CONNECTED_TO_WPCOM, MAX_IMAGE_COUNT } from './constants';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import useConnectInstagram from './use-connect-instagram';
import useConnectWpcom from './use-connect-wpcom';
import useInstagramGallery from './use-instagram-gallery';
import ImageTransition from './image-transition';
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

	const { images, isLoadingGallery, setImages } = useInstagramGallery( {
		accessToken,
		noticeOperations,
		setAttributes,
	} );
	const { isConnecting, connectToService, disconnectFromService } = useConnectInstagram( {
		accessToken,
		noticeOperations,
		setAttributes,
		setImages,
	} );
	const { isRequestingWpcomConnectUrl, wpcomConnectUrl } = useConnectWpcom();

	const unselectedCount = count > images.length ? images.length : count;

	useEffect( () => {
		const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
		if ( ! isEqual( validatedAttributes, attributes ) ) {
			setAttributes( validatedAttributes );
		}
	}, [ attributes, setAttributes ] );

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

	return (
		<div className={ blockClasses }>
			{ showPlaceholder && (
				<Placeholder
					icon="instagram"
					instructions={
						! IS_CURRENT_USER_CONNECTED_TO_WPCOM
							? __( "First, you'll need to connect to WordPress.com.", 'jetpack' )
							: __( 'Connect to Instagram to start sharing your images.', 'jetpack' )
					}
					label={ __( 'Latest Instagram Posts', 'jetpack' ) }
					notices={ noticeUI }
				>
					{ IS_CURRENT_USER_CONNECTED_TO_WPCOM ? (
						<Button disabled={ isConnecting } isLarge isPrimary onClick={ connectToService }>
							{ isConnecting
								? __( 'Connecting…', 'jetpack' )
								: __( 'Connect to Instagram', 'jetpack' ) }
						</Button>
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
						{ IS_CURRENT_USER_CONNECTED_TO_WPCOM && (
							<PanelRow>
								<div>
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
									<p className="wp-block-jetpack-instagram-gallery__disconnection-warning">
										{ __(
											'This will invalidate all Latest Instagram Posts blocks and Instagram widgets associated to this account.',
											'jetpack'
										) }
									</p>
								</div>
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
