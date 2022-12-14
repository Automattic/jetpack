import { __ } from '@wordpress/i18n';
// NOTE: We only import the debounce function here for reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';
import React, { Component } from 'react';
import { SEARCH_RESULTS_CLASS_NAME, SEARCH_RESULTS_LOAD_MORE_OFFSET } from '../lib/constants';
import './scroll-button.scss';

class ScrollButton extends Component {
	scrollElement = document.getElementsByClassName( SEARCH_RESULTS_CLASS_NAME )[ 0 ];
	componentDidMount() {
		this.scrollElement.addEventListener( 'scroll', this.checkScroll );
	}
	componentDidUnmount() {
		this.scrollElement.removeEventListener( 'scroll', this.checkScroll );
	}

	checkScroll = debounce( () => {
		const visibleHeightToLoadMore =
			this.scrollElement.clientHeight +
			this.scrollElement.scrollTop +
			SEARCH_RESULTS_LOAD_MORE_OFFSET;

		if (
			this.props.enableLoadOnScroll &&
			visibleHeightToLoadMore >= this.scrollElement.scrollHeight
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
					<span>{ __( 'Loading…', 'jetpack-search-pkg' ) }</span>
				) : (
					<span>{ __( 'Load more', 'jetpack-search-pkg' ) }</span>
				) }
			</button>
		);
	}
}

export default ScrollButton;
