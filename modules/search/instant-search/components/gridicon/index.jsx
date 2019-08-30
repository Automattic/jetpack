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
import './style.scss';

class Gridicon extends Component {
	needsOffset( icon, size ) {
		const iconNeedsOffset = [
			'gridicons-add-outline',
			'gridicons-add',
			'gridicons-align-image-center',
			'gridicons-align-image-left',
			'gridicons-align-image-none',
			'gridicons-align-image-right',
			'gridicons-attachment',
			'gridicons-backspace',
			'gridicons-bold',
			'gridicons-bookmark-outline',
			'gridicons-bookmark',
			'gridicons-calendar',
			'gridicons-cart',
			'gridicons-create',
			'gridicons-custom-post-type',
			'gridicons-external',
			'gridicons-folder',
			'gridicons-heading',
			'gridicons-help-outline',
			'gridicons-help',
			'gridicons-history',
			'gridicons-info-outline',
			'gridicons-info',
			'gridicons-italic',
			'gridicons-layout-blocks',
			'gridicons-link-break',
			'gridicons-link',
			'gridicons-list-checkmark',
			'gridicons-list-ordered',
			'gridicons-list-unordered',
			'gridicons-menus',
			'gridicons-minus',
			'gridicons-my-sites',
			'gridicons-notice-outline',
			'gridicons-notice',
			'gridicons-plans',
			'gridicons-plus-small',
			'gridicons-plus',
			'gridicons-popout',
			'gridicons-posts',
			'gridicons-scheduled',
			'gridicons-share-ios',
			'gridicons-star-outline',
			'gridicons-star',
			'gridicons-stats',
			'gridicons-status',
			'gridicons-thumbs-up',
			'gridicons-textcolor',
			'gridicons-time',
			'gridicons-trophy',
			'gridicons-user-circle',
		];

		if ( iconNeedsOffset.indexOf( icon ) >= 0 ) {
			return size % 18 === 0;
		}
		return false;
	}

	needsOffsetX( icon, size ) {
		const iconNeedsOffsetX = [
			'gridicons-arrow-down',
			'gridicons-arrow-up',
			'gridicons-comment',
			'gridicons-clear-formatting',
			'gridicons-flag',
			'gridicons-menu',
			'gridicons-reader',
			'gridicons-strikethrough',
		];

		if ( iconNeedsOffsetX.indexOf( icon ) >= 0 ) {
			return size % 18 === 0;
		}
		return false;
	}

	needsOffsetY( icon, size ) {
		const iconNeedsOffsetY = [
			'gridicons-align-center',
			'gridicons-align-justify',
			'gridicons-align-left',
			'gridicons-align-right',
			'gridicons-arrow-left',
			'gridicons-arrow-right',
			'gridicons-house',
			'gridicons-indent-left',
			'gridicons-indent-right',
			'gridicons-minus-small',
			'gridicons-print',
			'gridicons-sign-out',
			'gridicons-stats-alt',
			'gridicons-trash',
			'gridicons-underline',
			'gridicons-video-camera',
		];

		if ( iconNeedsOffsetY.indexOf( icon ) >= 0 ) {
			return size % 18 === 0;
		}
		return false;
	}

	renderIcon( icon ) {
		switch ( icon ) {
			default:
				return null;
			case 'gridicons-attachment':
				return (
					<g>
						<path d="M14 1c-2.762 0-5 2.238-5 5v10c0 1.657 1.343 3 3 3s2.99-1.343 2.99-3V6H13v10c0 .553-.447 1-1 1-.553 0-1-.447-1-1V6c0-1.657 1.343-3 3-3s3 1.343 3 3v10.125C17 18.887 14.762 21 12 21s-5-2.238-5-5v-5H5v5c0 3.866 3.134 7 7 7s6.99-3.134 6.99-7V6c0-2.762-2.228-5-4.99-5z" />
					</g>
				);
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
			case 'gridicons-camera':
				return (
					<g>
						<path d="M17 12c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3 3 1.3 3 3zm5-5v11c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2V4h4v1h2l1-2h6l1 2h2c1.1 0 2 .9 2 2zM7.5 9c0-.8-.7-1.5-1.5-1.5S4.5 8.2 4.5 9s.7 1.5 1.5 1.5S7.5 9.8 7.5 9zM19 12c0-2.8-2.2-5-5-5s-5 2.2-5 5 2.2 5 5 5 5-2.2 5-5z" />
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
			case 'gridicons-chevron-left':
				return (
					<g>
						<path d="M14 20l-8-8 8-8 1.414 1.414L8.828 12l6.586 6.586" />
					</g>
				);
			case 'gridicons-chevron-right':
				return (
					<g>
						<path d="M10 20l8-8-8-8-1.414 1.414L15.172 12l-6.586 6.586" />
					</g>
				);
			case 'gridicons-chevron-up':
				return (
					<g>
						<path d="M4 15l8-8 8 8-1.414 1.414L12 9.828l-6.586 6.586" />
					</g>
				);
			case 'gridicons-code':
				return (
					<g>
						<path d="M4.83 12l4.58 4.59L8 18l-6-6 6-6 1.41 1.41L4.83 12zm9.76 4.59L16 18l6-6-6-6-1.41 1.41L19.17 12l-4.58 4.59z" />
					</g>
				);
			case 'gridicons-comment':
				return (
					<g>
						<path d="M3 6v9c0 1.105.895 2 2 2h9v5l5.325-3.804c1.05-.75 1.675-1.963 1.675-3.254V6c0-1.105-.895-2-2-2H5c-1.105 0-2 .895-2 2z" />
					</g>
				);
			case 'gridicons-cross-small':
				return (
					<g>
						<path d="M17.705 7.705l-1.41-1.41L12 10.59 7.705 6.295l-1.41 1.41L10.59 12l-4.295 4.295 1.41 1.41L12 13.41l4.295 4.295 1.41-1.41L13.41 12l4.295-4.295z" />
					</g>
				);
			case 'gridicons-cross':
				return (
					<g>
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
					</g>
				);
			case 'gridicons-dropdown':
				return (
					<g>
						<path d="M7 10l5 5 5-5" />
					</g>
				);
			case 'gridicons-external':
				return (
					<g>
						<path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z" />
					</g>
				);
			case 'gridicons-folder-multiple':
				return (
					<g>
						<path d="M4 8c-1.105 0-2 .895-2 2v10c0 1.1.9 2 2 2h14c1.105 0 2-.895 2-2H4V8zm16 10H8c-1.105 0-2-.895-2-2V6c0-1.105.895-2 2-2h3c1.105 0 2 .895 2 2h7c1.105 0 2 .895 2 2v8c0 1.105-.895 2-2 2z" />
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
			case 'gridicons-image':
				return (
					<g>
						<path d="M13 9.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5zM22 6v12c0 1.105-.895 2-2 2H4c-1.105 0-2-.895-2-2V6c0-1.105.895-2 2-2h16c1.105 0 2 .895 2 2zm-2 0H4v7.444L8 9l5.895 6.55 1.587-1.85c.798-.932 2.24-.932 3.037 0L20 15.426V6z" />
					</g>
				);
			case 'gridicons-location':
				return (
					<g>
						<path d="M19 9c0-3.866-3.134-7-7-7S5 5.134 5 9c0 1.387.41 2.677 1.105 3.765h-.008C8.457 16.46 12 22 12 22l5.903-9.235h-.007C18.59 11.677 19 10.387 19 9zm-7 3c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" />
					</g>
				);
			case 'gridicons-mention':
				return (
					<g>
						<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10v-2c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v.5c0 .827-.673 1.5-1.5 1.5s-1.5-.673-1.5-1.5V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.65 0 3.102-.81 4.013-2.043C16.648 15.6 17.527 16 18.5 16c1.93 0 3.5-1.57 3.5-3.5V12c0-5.523-4.477-10-10-10zm0 13c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3z" />
					</g>
				);
			case 'gridicons-my-sites':
				return (
					<g>
						<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM3.5 12c0-1.232.264-2.402.736-3.46L8.29 19.65C5.456 18.272 3.5 15.365 3.5 12zm8.5 8.5c-.834 0-1.64-.12-2.4-.345l2.55-7.41 2.613 7.157c.017.042.038.08.06.117-.884.31-1.833.48-2.823.48zm1.172-12.485c.512-.027.973-.08.973-.08.458-.055.404-.728-.054-.702 0 0-1.376.108-2.265.108-.835 0-2.24-.107-2.24-.107-.458-.026-.51.674-.053.7 0 0 .434.055.892.082l1.324 3.63-1.86 5.578-3.096-9.208c.512-.027.973-.08.973-.08.458-.055.403-.728-.055-.702 0 0-1.376.108-2.265.108-.16 0-.347-.003-.547-.01C6.418 5.025 9.03 3.5 12 3.5c2.213 0 4.228.846 5.74 2.232-.037-.002-.072-.007-.11-.007-.835 0-1.427.727-1.427 1.51 0 .7.404 1.292.835 1.993.323.566.7 1.293.7 2.344 0 .727-.28 1.572-.646 2.748l-.848 2.833-3.072-9.138zm3.1 11.332l2.597-7.506c.484-1.212.645-2.18.645-3.044 0-.313-.02-.603-.057-.874.664 1.21 1.042 2.6 1.042 4.078 0 3.136-1.7 5.874-4.227 7.347z" />
					</g>
				);
			case 'gridicons-pages':
				return (
					<g>
						<path d="M16 8H8V6h8v2zm0 2H8v2h8v-2zm4-6v12l-6 6H6c-1.105 0-2-.895-2-2V4c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2zm-2 10V4H6v16h6v-4c0-1.105.895-2 2-2h4z" />
					</g>
				);
			case 'gridicons-plus-small':
				return (
					<g>
						<path d="M18 11h-5V6h-2v5H6v2h5v5h2v-5h5" />
					</g>
				);
			case 'gridicons-plus':
				return (
					<g>
						<path d="M20 13h-7v7h-2v-7H4v-2h7V4h2v7h7v2z" />
					</g>
				);
			case 'gridicons-reader':
				return (
					<g>
						<path d="M3 4v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4H3zm7 11H5v-1h5v1zm2-2H5v-1h7v1zm0-2H5v-1h7v1zm7 4h-5v-5h5v5zm0-7H5V6h14v2z" />
					</g>
				);
			case 'gridicons-refresh':
				return (
					<g>
						<path d="M17.91 14c-.478 2.833-2.943 5-5.91 5-3.308 0-6-2.692-6-6s2.692-6 6-6h2.172l-2.086 2.086L13.5 10.5 18 6l-4.5-4.5-1.414 1.414L14.172 5H12c-4.418 0-8 3.582-8 8s3.582 8 8 8c4.08 0 7.438-3.055 7.93-7h-2.02z" />
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
			case 'gridicons-stats-alt':
				return (
					<g>
						<path d="M21 21H3v-2h18v2zM8 10H4v7h4v-7zm6-7h-4v14h4V3zm6 3h-4v11h4V6z" />
					</g>
				);
			case 'gridicons-stats':
				return (
					<g>
						<path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zm0 16H5V5h14v14zM9 17H7v-5h2v5zm4 0h-2V7h2v10zm4 0h-2v-7h2v7z" />
					</g>
				);
			case 'gridicons-tag':
				return (
					<g>
						<path d="M20 2.007h-7.087c-.53 0-1.04.21-1.414.586L2.592 11.5c-.78.78-.78 2.046 0 2.827l7.086 7.086c.78.78 2.046.78 2.827 0l8.906-8.906c.376-.374.587-.883.587-1.413V4.007c0-1.105-.895-2-2-2zM17.007 9c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
					</g>
				);
			case 'gridicons-user-circle':
				return (
					<g>
						<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18.5c-4.694 0-8.5-3.806-8.5-8.5S7.306 3.5 12 3.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5zm0-8c-3.038 0-5.5 1.728-5.5 3.5s2.462 3.5 5.5 3.5 5.5-1.728 5.5-3.5-2.462-3.5-5.5-3.5zm0-.5c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
					</g>
				);
			case 'gridicons-user':
				return (
					<g>
						<path d="M12 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 16s8 0 8-2c0-2.4-3.9-5-8-5s-8 2.6-8 5c0 2 8 2 8 2z" />
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
		const { size = 24, class_name = '' } = this.props;
		const icon = 'gridicons-' + this.props.icon,
			needsOffset = this.needsOffset( icon, size ),
			needsOffsetX = this.needsOffsetX( icon, size ),
			needsOffsetY = this.needsOffsetY( icon, size );

		let iconClass = [ 'gridicon', icon, class_name ];

		if ( needsOffset ) {
			iconClass.push( 'needs-offset' );
		}
		if ( needsOffsetX ) {
			iconClass.push( 'needs-offset-x' );
		}
		if ( needsOffsetY ) {
			iconClass.push( 'needs-offset-y' );
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
				{ this.renderIcon( icon ) }
			</svg>
		);
	}
}

export default Gridicon;
