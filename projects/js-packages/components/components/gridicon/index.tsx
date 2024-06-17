/* !!!
This is a fork of the Jetpack Gridicon code:
 https://github.com/Automattic/jetpack/blob/f8078c2cd12ac508334da2fb08e37a92cf283c14/_inc/client/components/gridicon/index.jsx

It has been modified to work with Preact, and only includes the icons that we need.
!!! */

import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { Component } from 'react';
import './style.scss';
import { GridiconProps } from './types';

class Gridicon extends Component< GridiconProps > {
	static defaultProps = {
		'aria-hidden': 'false',
		focusable: 'true',
	};

	needsOffset( icon, size ) {
		const iconNeedsOffset = [
			'gridicons-arrow-left',
			'gridicons-arrow-right',
			'gridicons-calendar',
			'gridicons-cart',
			'gridicons-folder',
			'gridicons-info',
			'gridicons-info-outline',
			'gridicons-posts',
			'gridicons-star-outline',
			'gridicons-star',
		];

		if ( iconNeedsOffset.indexOf( icon ) >= 0 ) {
			return size % 18 === 0;
		}
		return false;
	}

	getSVGDescription( icon ) {
		// Enable overriding desc with falsy/truthy values.
		if ( 'description' in this.props ) {
			return this.props.description;
		}

		switch ( icon ) {
			default:
				return '';
			case 'gridicons-audio':
				return __( 'Has audio.', 'jetpack' );
			case 'gridicons-arrow-left':
				return __( 'Arrow left', 'jetpack' );
			case 'gridicons-arrow-right':
				return __( 'Arrow right', 'jetpack' );
			case 'gridicons-calendar':
				return __( 'Is an event.', 'jetpack' );
			case 'gridicons-cart':
				return __( 'Is a product.', 'jetpack' );
			case 'chevron-down':
				return __( 'Show filters', 'jetpack' );
			case 'gridicons-comment':
				return __( 'Matching comment.', 'jetpack' );
			case 'gridicons-cross':
				return __( 'Close.', 'jetpack' );
			case 'gridicons-filter':
				return __( 'Toggle search filters.', 'jetpack' );
			case 'gridicons-folder':
				return __( 'Category', 'jetpack' );
			case 'gridicons-info':
			case 'gridicons-info-outline':
				return __( 'Information.', 'jetpack' );
			case 'gridicons-image-multiple':
				return __( 'Has multiple images.', 'jetpack' );
			case 'gridicons-image':
				return __( 'Has an image.', 'jetpack' );
			case 'gridicons-page':
				return __( 'Page', 'jetpack' );
			case 'gridicons-post':
				return __( 'Post', 'jetpack' );
			case 'gridicons-jetpack-search':
			case 'gridicons-search':
				return __( 'Magnifying Glass', 'jetpack' );
			case 'gridicons-tag':
				return __( 'Tag', 'jetpack' );
			case 'gridicons-video':
				return __( 'Has a video.', 'jetpack' );
		}
	}

	renderIcon( icon ) {
		switch ( icon ) {
			default:
				return null;
			case 'gridicons-audio':
				return (
					<g>
						<path d="M8 4v10.184C7.686 14.072 7.353 14 7 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7h7v4.184c-.314-.112-.647-.184-1-.184-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4H8z" />
					</g>
				);
			case 'gridicons-arrow-left':
				return (
					<g>
						<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
					</g>
				);
			case 'gridicons-arrow-right':
				return (
					<g>
						<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
					</g>
				);
			case 'gridicons-block':
				return (
					<g>
						<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12c0-4.418 3.582-8 8-8 1.848 0 3.545.633 4.9 1.686L5.686 16.9C4.633 15.545 4 13.848 4 12zm8 8c-1.848 0-3.546-.633-4.9-1.686L18.314 7.1C19.367 8.455 20 10.152 20 12c0 4.418-3.582 8-8 8z" />
					</g>
				);
			case 'gridicons-calendar':
				return (
					<g>
						<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.105 0-2 .896-2 2v13c0 1.104.895 2 2 2h14c1.104 0 2-.896 2-2V6c0-1.104-.896-2-2-2zm0 15H5V8h14v11z" />
					</g>
				);
			case 'gridicons-cart':
				return (
					<g>
						<path d="M9 20c0 1.1-.9 2-2 2s-1.99-.9-1.99-2S5.9 18 7 18s2 .9 2 2zm8-2c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm.396-5c.937 0 1.75-.65 1.952-1.566L21 5H7V4c0-1.105-.895-2-2-2H3v2h2v11c0 1.105.895 2 2 2h12c0-1.105-.895-2-2-2H7v-2h10.396z" />
					</g>
				);
			case 'gridicons-checkmark':
				return (
					<g>
						<path d="M11 17.768l-4.884-4.884 1.768-1.768L11 14.232l8.658-8.658C17.823 3.39 15.075 2 12 2 6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-1.528-.353-2.97-.966-4.266L11 17.768z" />
					</g>
				);
			case 'gridicons-chevron-left':
				return (
					<g>
						<path d="M16.443 7.41L15.0399 6L9.06934 12L15.0399 18L16.443 16.59L11.8855 12L16.443 7.41Z" />
					</g>
				);
			case 'gridicons-chevron-right':
				return (
					<g>
						<path d="M10.2366 6L8.8335 7.41L13.391 12L8.8335 16.59L10.2366 18L16.2072 12L10.2366 6Z" />
					</g>
				);
			case 'gridicons-chevron-down':
				return (
					<g>
						<path d="M20 9l-8 8-8-8 1.414-1.414L12 14.172l6.586-6.586" />
					</g>
				);
			case 'gridicons-comment':
				return (
					<g>
						<path d="M3 6v9c0 1.105.895 2 2 2h9v5l5.325-3.804c1.05-.75 1.675-1.963 1.675-3.254V6c0-1.105-.895-2-2-2H5c-1.105 0-2 .895-2 2z" />
					</g>
				);
			case 'gridicons-computer':
				return (
					<g>
						<path d="M20 2H4c-1.104 0-2 .896-2 2v12c0 1.104.896 2 2 2h6v2H7v2h10v-2h-3v-2h6c1.104 0 2-.896 2-2V4c0-1.104-.896-2-2-2zm0 14H4V4h16v12z"></path>
					</g>
				);
			case 'gridicons-cross':
				return (
					<g>
						<path d="M18.36 19.78L12 13.41l-6.36 6.37-1.42-1.42L10.59 12 4.22 5.64l1.42-1.42L12 10.59l6.36-6.36 1.41 1.41L13.41 12l6.36 6.36z" />
					</g>
				);
			case 'gridicons-filter':
				return (
					<g>
						<path d="M10 19h4v-2h-4v2zm-4-6h12v-2H6v2zM3 5v2h18V5H3z" />
					</g>
				);
			case 'gridicons-folder':
				return (
					<g>
						<path d="M18 19H6c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2h7c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2z" />
					</g>
				);
			case 'gridicons-image':
				return (
					<g>
						<path d="M13 9.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zM22 6v12c0 1.105-.895 2-2 2H4c-1.105 0-2-.895-2-2V6c0-1.105.895-2 2-2h16c1.105 0 2 .895 2 2zm-2 0H4v7.444L8 9l5.895 6.55 1.587-1.85c.798-.932 2.24-.932 3.037 0L20 15.426V6z" />
					</g>
				);
			case 'gridicons-image-multiple':
				return (
					<g>
						<path d="M15 7.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S17.328 9 16.5 9 15 8.328 15 7.5zM4 20h14c0 1.105-.895 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.105.895-2 2-2v14zM22 4v12c0 1.105-.895 2-2 2H8c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zM8 4v6.333L11 7l4.855 5.395.656-.73c.796-.886 2.183-.886 2.977 0l.513.57V4H8z" />
					</g>
				);
			case 'gridicons-info':
				return (
					<g>
						<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
					</g>
				);
			case 'gridicons-info-outline':
				return (
					<g>
						<path d="M13 9h-2V7h2v2zm0 2h-2v6h2v-6zm-1-7c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8m0-2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path>
					</g>
				);
			case 'gridicons-jetpack-search':
				return (
					<g>
						<path d="M0 9.257C0 4.15 4.151 0 9.257 0c5.105 0 9.256 4.151 9.256 9.257a9.218 9.218 0 01-2.251 6.045l.034.033h1.053L24 22.01l-1.986 1.989-6.664-6.662v-1.055l-.033-.033a9.218 9.218 0 01-6.06 2.264C4.15 18.513 0 14.362 0 9.257zm4.169 1.537h4.61V1.82l-4.61 8.973zm5.547-3.092v8.974l4.61-8.974h-4.61z" />
					</g>
				);
			case 'gridicons-phone':
				return (
					<g>
						<path d="M16 2H8c-1.104 0-2 .896-2 2v16c0 1.104.896 2 2 2h8c1.104 0 2-.896 2-2V4c0-1.104-.896-2-2-2zm-3 19h-2v-1h2v1zm3-2H8V5h8v14z"></path>
					</g>
				);
			case 'gridicons-pages':
				return (
					<g>
						<path d="M16 8H8V6h8v2zm0 2H8v2h8v-2zm4-6v12l-6 6H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zm-2 10V4H6v16h6v-4c0-1.105.895-2 2-2h4z" />
					</g>
				);
			case 'gridicons-posts':
				return (
					<g>
						<path d="M16 19H3v-2h13v2zm5-10H3v2h18V9zM3 5v2h11V5H3zm14 0v2h4V5h-4zm-6 8v2h10v-2H11zm-8 0v2h5v-2H3z" />
					</g>
				);
			case 'gridicons-search':
				return (
					<g>
						<path d="M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z" />
					</g>
				);
			case 'gridicons-star-outline':
				return (
					<g>
						<path d="M12 6.308l1.176 3.167.347.936.997.042 3.374.14-2.647 2.09-.784.62.27.963.91 3.25-2.813-1.872-.83-.553-.83.552-2.814 1.87.91-3.248.27-.962-.783-.62-2.648-2.092 3.374-.14.996-.04.347-.936L12 6.308M12 2L9.418 8.953 2 9.257l5.822 4.602L5.82 21 12 16.89 18.18 21l-2.002-7.14L22 9.256l-7.418-.305L12 2z" />
					</g>
				);
			case 'gridicons-star':
				return (
					<g>
						<path d="M12 2l2.582 6.953L22 9.257l-5.822 4.602L18.18 21 12 16.89 5.82 21l2.002-7.14L2 9.256l7.418-.304" />
					</g>
				);
			case 'gridicons-tag':
				return (
					<g>
						<path d="M20 2.007h-7.087c-.53 0-1.04.21-1.414.586L2.592 11.5c-.78.78-.78 2.046 0 2.827l7.086 7.086c.78.78 2.046.78 2.827 0l8.906-8.906c.376-.374.587-.883.587-1.413V4.007c0-1.105-.895-2-2-2zM17.007 9c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
					</g>
				);
			case 'gridicons-video':
				return (
					<g>
						<path d="M20 4v2h-2V4H6v2H4V4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2v-2h2v2h12v-2h2v2c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zM6 16H4v-3h2v3zm0-5H4V8h2v3zm4 4V9l4.5 3-4.5 3zm10 1h-2v-3h2v3zm0-5h-2V8h2v3z" />
					</g>
				);
			case 'gridicons-lock':
				return (
					<>
						<g id="lock">
							<path
								d="M18,8h-1V7c0-2.757-2.243-5-5-5S7,4.243,7,7v1H6c-1.105,0-2,0.895-2,2v10c0,1.105,0.895,2,2,2h12c1.105,0,2-0.895,2-2V10
									C20,8.895,19.105,8,18,8z M9,7c0-1.654,1.346-3,3-3s3,1.346,3,3v1H9V7z M13,15.723V18h-2v-2.277c-0.595-0.346-1-0.984-1-1.723
									c0-1.105,0.895-2,2-2s2,0.895,2,2C14,14.738,13.595,15.376,13,15.723z"
							/>
						</g>
						<g id="Layer_1"></g>
					</>
				);
			case 'gridicons-external':
				return (
					<g>
						<path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z" />
					</g>
				);
		}
	}

	render() {
		const { size = 24, className = '' } = this.props;

		const height = this.props.height || size;
		const width = this.props.width || size;
		const style = this.props.style || { height, width };

		const icon = 'gridicons-' + this.props.icon;

		const iconClass = clsx( 'gridicon', icon, className, {
			'needs-offset': this.needsOffset( icon, size ),
		} );
		const description = this.getSVGDescription( icon );

		return (
			<svg
				className={ iconClass }
				focusable={ this.props.focusable }
				height={ height }
				onClick={ this.props.onClick }
				style={ style }
				viewBox="0 0 24 24"
				width={ width }
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden={ this.props[ 'aria-hidden' ] }
			>
				{ description ? <desc>{ description }</desc> : null }
				{ this.renderIcon( icon ) }
			</svg>
		);
	}
}

export default Gridicon;
