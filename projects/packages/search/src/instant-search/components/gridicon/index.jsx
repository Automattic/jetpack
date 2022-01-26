/* !!!
This is a fork of the Jetpack Gridicon code:
 https://github.com/Automattic/jetpack/blob/f8078c2cd12ac508334da2fb08e37a92cf283c14/_inc/client/components/gridicon/index.jsx

It has been modified to work with Preact, and only includes the icons that we need.
!!! */

/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';

import './style.scss';

class Gridicon extends Component {
	static defaultProps = {
		'aria-hidden': 'false',
		focusable: 'true',
	};

	needsOffset( icon, size ) {
		const iconNeedsOffset = [
			'gridicons-calendar',
			'gridicons-cart',
			'gridicons-folder',
			'gridicons-info',
			'gridicons-posts',
			'gridicons-star-outline',
			'gridicons-star',
		];

		if ( iconNeedsOffset.indexOf( icon ) >= 0 ) {
			return size % 18 === 0;
		}
		return false;
	}

	getSVGTitle( icon ) {
		// Enable overriding title with falsy/truthy values.
		if ( 'title' in this.props ) {
			return this.props.title ? <title>{ this.props.title }</title> : null;
		}

		switch ( icon ) {
			default:
				return null;
			case 'gridicons-audio':
				return <title>{ __( 'Has audio.', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-calendar':
				return <title>{ __( 'Is an event.', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-cart':
				return <title>{ __( 'Is a product.', 'jetpack-search-pkg' ) }</title>;
			case 'chevron-down':
				return <title>{ __( 'Show filters', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-comment':
				return <title>{ __( 'Matching comment.', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-cross':
				return <title>{ __( 'Close search results', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-filter':
				return <title>{ __( 'Toggle search filters.', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-folder':
				return <title>{ __( 'Category', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-image-multiple':
				return <title>{ __( 'Has multiple images.', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-image':
				return <title>{ __( 'Has an image.', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-page':
				return <title>{ __( 'Page', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-post':
				return <title>{ __( 'Post', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-jetpack-search':
			case 'gridicons-search':
				return <title>{ __( 'Magnifying Glass', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-tag':
				return <title>{ __( 'Tag', 'jetpack-search-pkg' ) }</title>;
			case 'gridicons-video':
				return <title>{ __( 'Has a video.', 'jetpack-search-pkg' ) }</title>;
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
			case 'gridicons-jetpack-search':
				return (
					<g>
						<path d="M0 9.257C0 4.15 4.151 0 9.257 0c5.105 0 9.256 4.151 9.256 9.257a9.218 9.218 0 01-2.251 6.045l.034.033h1.053L24 22.01l-1.986 1.989-6.664-6.662v-1.055l-.033-.033a9.218 9.218 0 01-6.06 2.264C4.15 18.513 0 14.362 0 9.257zm4.169 1.537h4.61V1.82l-4.61 8.973zm5.547-3.092v8.974l4.61-8.974h-4.61z" />
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
		}
	}

	render() {
		const { size = 24, className = '' } = this.props;

		const height = this.props.height || size;
		const width = this.props.width || size;
		const style = this.props.style || { height, width };

		const icon = 'gridicons-' + this.props.icon,
			needsOffset = this.needsOffset( icon, size );

		let iconClass = [ 'gridicon', icon, className ];

		if ( needsOffset ) {
			iconClass.push( 'needs-offset' );
		}
		iconClass = iconClass.join( ' ' );

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
				{ this.getSVGTitle( icon ) }
				{ this.renderIcon( icon ) }
			</svg>
		);
	}
}

export default Gridicon;
