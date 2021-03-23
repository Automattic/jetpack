/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

/**
 * Internal dependencies
 */
import './scroll-button.scss';

class ScrollButton extends Component {
	overlayElement = document.getElementsByClassName( 'jetpack-instant-search__overlay' )[ 0 ];
	componentDidMount() {
		this.overlayElement.addEventListener( 'scroll', this.checkScroll );
	}
	componentDidUnmount() {
		this.overlayElement.removeEventListener( 'scroll', this.checkScroll );
	}

	checkScroll = debounce( () => {
		if (
			this.props.enableLoadOnScroll &&
			window.innerHeight + this.overlayElement.scrollTop === this.overlayElement.scrollHeight
		) {
			this.props.onLoadNextPage();
		}
	}, 100 );

	render() {
		return (
			<button
				className="jetpack-instant-search__scroll-button"
				disabled={ this.props.isLoading }
				onClick={ this.props.onLoadNextPage }
			>
				{ this.props.isLoading ? (
					<span>{ __( 'Loading…', 'jetpack' ) }</span>
				) : (
					<span>{ __( 'Load more', 'jetpack' ) }</span>
				) }
			</button>
		);
	}
}

export default ScrollButton;
