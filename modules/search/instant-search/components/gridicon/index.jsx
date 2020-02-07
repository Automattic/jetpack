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
			case 'gridicons-cross':
				return <title>{ __( 'Close search overlay' ) }</title>;
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
			case 'gridicons-cross':
				return (
					<g>
						<path d="M18.36 19.78L12 13.41l-6.36 6.37-1.42-1.42L10.59 12 4.22 5.64l1.42-1.42L12 10.59l6.36-6.36 1.41 1.41L13.41 12l6.36 6.36z" />
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
			case 'gridicons-jetpack-search':
				return (
					<g>
						<path d="M0 12V0h28v24H0zm0 0" fill="#fff" fill-opacity="0" />
						<path d="M18.734 18.07l-2.055-2.066v-.31c0-.22-.02-.344-.066-.422-.11-.16-.203-.195-.3-.105-.125.113-.25.176-.37.176-.062 0-.2.055-.312.117-.168.105-.645.32-.97.438a5.4 5.4 0 0 1-.531.152c-.262.06-1.027.148-1.316.148-.48 0-1.47-.176-1.715-.305-.043-.02-.094-.04-.117-.04-.043 0-.285-.102-.64-.27-.195-.094-.598-.328-.637-.37l-.172-.13c-.367-.258-.902-.793-1.227-1.227-.383-.504-.81-1.437-.938-2.05l-.1-.418c-.05-.246-.055-1.62-.004-1.828l.1-.39c.06-.285.19-.687.297-.922l.133-.3c.086-.19.3-.543.387-.637.043-.047.074-.11.074-.137s.02-.062.035-.07.098-.098.18-.207a6.66 6.66 0 0 1 1.035-1c.32-.246 1.266-.754 1.398-.754.04 0 .086-.023.098-.043.012-.027.066-.043.125-.043.05 0 .11-.02.133-.035.047-.043.348-.113.762-.18.355-.062 1.6-.035 1.938.04l.375.074c.078.016.148.04.16.063s.07.04.125.04.113.02.13.043.06.043.102.043c.098 0 .93.418 1.043.52.047.043.11.078.14.078s.055.012.055.035c0 .016.07.078.164.133.262.164 1.078 1.02 1.316 1.383.53.797.828 1.625.95 2.633.094.78-.055 1.887-.352 2.578l-.078.203c-.145.363-.434.87-.71 1.23l-.184.277c0 .02-.04.082-.082.14-.164.215.1.398.54.38l.273-.012 2.063 2.086 2.06 2.133c0 .07-1.137 1.203-1.2 1.195-.03-.004-.98-.934-2.11-2.066zm-5.398-3.375l.535-1.047.81-1.586 1.223-2.53c-.03-.008-.656-.012-1.39-.008l-1.34.012-.023 2.715.023 2.695c.02-.008.098-.12.164-.25zm-.75-6.004l-.02-2.734c-.023 0-.168.266-.324.6l-.64 1.273-1.574 3.082c-.133.254-.227.48-.215.5s.613.035 1.39.03l1.37-.012zm0 0" />
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
				onClick={ this.props.onClick }
				style={ { height: 24, width: 24 } }
				viewBox="0 0 24 24"
				width={ size }
				xmlns="http://www.w3.org/2000/svg"
			>
				{ this.getSVGTitle( icon ) }
				{ this.renderIcon( icon ) }
			</svg>
		);
	}
}

export default Gridicon;
