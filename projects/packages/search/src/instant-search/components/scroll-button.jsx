import { __ } from '@wordpress/i18n';
import debounce from 'debounce';
import * as React from 'react';
import { Component } from 'react';
import { SEARCH_RESULTS_CLASS_NAME, SEARCH_RESULTS_LOAD_MORE_OFFSET } from '../lib/constants';
import './scroll-button.scss';

class ScrollButton extends Component {
	componentDidMount() {
		this.scrollElement = document.getElementsByClassName( SEARCH_RESULTS_CLASS_NAME )[ 0 ];
		this.scrollElement?.addEventListener( 'scroll', this.checkScroll );
	}

	componentWillUnmount() {
		this.scrollElement?.removeEventListener( 'scroll', this.checkScroll );
		this.checkScroll.clear();
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
