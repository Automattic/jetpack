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

class ScrollButton extends Component {
	componentDidMount() {
		this.props.enableLoadOnScroll && document.addEventListener( 'scroll', this.checkScroll );
	}
	componentDidUnmount() {
		document.removeEventListener( 'scroll', this.checkScroll );
	}

	checkScroll = debounce( () => {
		if (
			this.props.enableLoadOnScroll &&
			window.innerHeight + window.scrollY === document.body.offsetHeight
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
