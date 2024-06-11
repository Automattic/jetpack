import { imagePath } from 'constants/urls';
import { getUserLocale as getLocaleSlug } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { startsWith } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import './style.scss';

// the locale slugs for each stores' image paths follow different rules
// therefore we have to perform some trickery in getLocaleSlug()
const APP_STORE_BADGE_URLS = {
	ios: {
		defaultSrc: imagePath + '/get-apps-ios-store.svg',
		src: 'https://linkmaker.itunes.apple.com/assets/shared/badges/{localeSlug}/appstore-lrg.svg',
		tracksEvent: 'calypso_app_download_ios_click',
		getStoreLink: utm_source =>
			`https://apps.apple.com/app/apple-store/id1565481562?pt=299112&ct=${ utm_source }&mt=8`,
		getTitleText: () => __( 'Download the Jetpack iOS mobile app.', 'jetpack' ),
		getAltText: () => __( 'Apple App Store download badge', 'jetpack' ),
		getLocaleSlug: function () {
			const localeSlug = getLocaleSlug();
			const localeSlugPrefix = localeSlug.split( '-' )[ 0 ];
			return localeSlugPrefix === 'en' ? 'en-us' : `${ localeSlugPrefix }-${ localeSlugPrefix }`;
		},
	},
	android: {
		defaultSrc: imagePath + '/get-apps-google-play.png',
		src: 'https://play.google.com/intl/en_us/badges/images/generic/{localeSlug}_badge_web_generic.png',
		tracksEvent: 'calypso_app_download_android_click',
		getStoreLink: (
			utm_source,
			utm_medium = 'web',
			utm_campaign = 'mobile-download-promo-pages'
		) =>
			`https://play.google.com/store/apps/details?id=com.jetpack.android&referrer=utm_source%3D%${ utm_source }%26utm_medium%3D${ utm_medium }%26utm_campaign%3D${ utm_campaign }`,
		getTitleText: () => __( 'Download the Jetpack Android mobile app.', 'jetpack' ),
		getAltText: () => __( 'Google Play Store download badge', 'jetpack' ),
		getLocaleSlug: function () {
			const localeSlug = getLocaleSlug();
			const localeSlugPrefix = localeSlug.split( '-' )[ 0 ];
			return localeSlugPrefix;
		},
	},
};

class AppsBadge extends PureComponent {
	static propTypes = {
		altText: PropTypes.string,
		storeLink: PropTypes.string,
		storeName: PropTypes.oneOf( [ 'ios', 'android' ] ).isRequired,
		titleText: PropTypes.string,
		onBadgeClick: PropTypes.func,
		utm_source: PropTypes.string,
		utm_campaign: PropTypes.string,
		utm_medium: PropTypes.string,
	};

	static defaultProps = {
		altText: '',
		storeLink: null,
		titleText: '',
	};

	constructor( props ) {
		super( props );

		const localeSlug = APP_STORE_BADGE_URLS[ props.storeName ].getLocaleSlug().toLowerCase();

		const shouldLoadExternalImage = ! startsWith( localeSlug, 'en' );

		this.state = {
			shouldLoadExternalImage,
			imageSrc: shouldLoadExternalImage
				? APP_STORE_BADGE_URLS[ props.storeName ].src.replace( '{localeSlug}', localeSlug )
				: APP_STORE_BADGE_URLS[ props.storeName ].defaultSrc,
		};

		if ( shouldLoadExternalImage ) {
			this.image = null;
			this.loadImage();
		}
	}

	loadImage() {
		this.image = new window.Image();
		this.image.src = this.state.imageSrc;
		this.image.onload = this.onLoadImageComplete;
		this.image.onerror = this.onLoadImageError;
	}

	onLoadImageComplete = () => {
		this.setState( {
			hasExternalImageLoaded: true,
		} );
	};

	onLoadImageError = () => {
		this.setState( {
			hasExternalImageLoaded: false,
			imageSrc: APP_STORE_BADGE_URLS[ this.props.storeName ].defaultSrc,
		} );
	};

	onLinkClick = () => {
		this.props.onBadgeClick( this.props.storeName );
	};

	render() {
		const { altText, titleText, storeLink, storeName, utm_source, utm_medium, utm_campaign } =
			this.props;
		const { imageSrc, hasExternalImageLoaded } = this.state;

		const figureClassNames = clsx( 'apps-badge', {
			[ `${ storeName }-app-badge` ]: true,
			'is-external-image': hasExternalImageLoaded,
		} );

		const badge = APP_STORE_BADGE_URLS[ storeName ];

		return (
			<figure className={ figureClassNames }>
				<a
					href={
						storeLink ? storeLink : badge.getStoreLink( utm_source, utm_medium, utm_campaign )
					}
					onClick={ this.onLinkClick }
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						src={ imageSrc }
						title={ titleText ? titleText : badge.getTitleText() }
						alt={ altText ? altText : badge.getAltText() }
					/>
				</a>
			</figure>
		);
	}
}

export default AppsBadge;
