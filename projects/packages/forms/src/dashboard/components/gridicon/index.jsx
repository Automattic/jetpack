/* !!!
This is a fork of the Jetpack Gridicon code:
 https://github.com/Automattic/jetpack/blob/f8078c2cd12ac508334da2fb08e37a92cf283c14/_inc/client/components/gridicon/index.jsx
It has been modified to work with Preact, and only includes the icons that we need.
!!! */

import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './style.scss';

class Gridicon extends Component {
	static defaultProps = {
		'aria-hidden': 'false',
		focusable: 'true',
	};

	needsOffset( icon, size ) {
		const iconNeedsOffset = [ 'gridicons-arrow-left', 'gridicons-arrow-right', 'gridicons-star' ];

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
			case 'gridicons-arrow-left':
				return <title>{ __( 'Arrow left', 'jetpack-forms' ) }</title>;
			case 'gridicons-arrow-right':
				return <title>{ __( 'Arrow right', 'jetpack-forms' ) }</title>;
			case 'gridicons-search':
				return <title>{ __( 'Magnifying Glass', 'jetpack-forms' ) }</title>;
		}
	}

	renderIcon( icon ) {
		switch ( icon ) {
			default:
				return null;
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
			case 'gridicons-search':
				return (
					<g>
						<path d="M21 19l-5.154-5.154C16.574 12.742 17 11.42 17 10c0-3.866-3.134-7-7-7s-7 3.134-7 7 3.134 7 7 7c1.42 0 2.742-.426 3.846-1.154L19 21l2-2zM5 10c0-2.757 2.243-5 5-5s5 2.243 5 5-2.243 5-5 5-5-2.243-5-5z" />
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
				aria-label={ this.props.description }
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
