/** @jsx h **/

/* !!!
This is a fork of the Jetpack Gridicon code:
 https://github.com/Automattic/jetpack/blob/f8078c2cd12ac508334da2fb08e37a92cf283c14/_inc/client/components/gridicon/index.jsx

It has been modified to work with Preact, and only includes the icons that we need.
!!! */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

import './style.scss';

class Gridicon extends Component {
	needsOffset( icon, size ) {
		const iconNeedsOffset = [
			'gridicons-calendar',
			'gridicons-cart',
			'gridicons-folder',
			'gridicons-info',
		];

		if ( iconNeedsOffset.indexOf( icon ) >= 0 ) {
			return size % 18 === 0;
		}
		return false;
	}

	getSVGTitle( icon ) {
		switch ( icon ) {
			default:
				return null;
			case 'gridicons-audio':
				return <title>{ __( 'Has audio.' ) }</title>;
			case 'gridicons-calendar':
				return <title>{ __( 'Is an event.' ) }</title>;
			case 'gridicons-cart':
				return <title>{ __( 'Is a product.' ) }</title>;
			case 'gridicons-comment':
				return <title>{ __( 'Matching comment.' ) }</title>;
			case 'gridicons-folder':
				return <title>{ __( 'Category' ) }</title>;
			case 'gridicons-image-multiple':
				return <title>{ __( 'Has multiple images.' ) }</title>;
			case 'gridicons-image':
				return <title>{ __( 'Has an image.' ) }</title>;
			case 'gridicons-page':
				return <title>{ __( 'Page' ) }</title>;
			case 'gridicons-jetpack-search':
			case 'gridicons-search':
				return <title>{ __( 'Search' ) }</title>;
			case 'gridicons-tag':
				return <title>{ __( 'Tag' ) }</title>;
			case 'gridicons-video':
				return <title>{ __( 'Has a video.' ) }</title>;
			case 'gridicons-filter':
				return <title>{ __( 'Toggle search filters.' ) }</title>;
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
			case 'gridicons-comment':
				return (
					<g>
						<path d="M3 6v9c0 1.105.895 2 2 2h9v5l5.325-3.804c1.05-.75 1.675-1.963 1.675-3.254V6c0-1.105-.895-2-2-2H5c-1.105 0-2 .895-2 2z" />
					</g>
				);
			case 'gridicons-folder':
				return (
					<g>
						<path d="M18 19H6c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2h7c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2z" />
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
			case 'gridicons-pages':
				return (
					<g>
						<path d="M16 8H8V6h8v2zm0 2H8v2h8v-2zm4-6v12l-6 6H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zm-2 10V4H6v16h6v-4c0-1.105.895-2 2-2h4z" />
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
			case 'gridicons-filter':
				return (
					<g>
						<path d="M10 19h4v-2h-4v2zm-4-6h12v-2H6v2zM3 5v2h18V5H3z" />
					</g>
				);
		}
	}

	render() {
		const { size = 24, class_name = '' } = this.props;
		const icon = 'gridicons-' + this.props.icon,
			needsOffset = this.needsOffset( icon, size );

		let iconClass = [ 'gridicon', icon, class_name ];

		if ( needsOffset ) {
			iconClass.push( 'needs-offset' );
		}
		iconClass = iconClass.join( ' ' );

		return (
			<svg
				className={ iconClass }
				height={ size }
				width={ size }
				onClick={ this.props.onClick }
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
			>
				{ this.getSVGTitle( icon ) }
				{ this.renderIcon( icon ) }
			</svg>
		);
	}
}

export default Gridicon;
