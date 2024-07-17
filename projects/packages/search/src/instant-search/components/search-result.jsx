import React, { Component } from 'react';
import { RESULT_FORMAT_EXPANDED, RESULT_FORMAT_PRODUCT } from '../lib/constants';
import { recordTrainTracksRender, recordTrainTracksInteract } from '../lib/tracks';
import SearchResultExpanded from './search-result-expanded';
import SearchResultMinimal from './search-result-minimal';
import SearchResultProduct from './search-result-product';
import './search-result.scss';

class SearchResult extends Component {
	componentDidMount() {
		!! this.props.railcar && recordTrainTracksRender( this.getCommonTrainTracksProps() );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.railcar !== prevProps.railcar ) {
			!! this.props.railcar && recordTrainTracksRender( this.getCommonTrainTracksProps() );
		}
	}

	getCommonTrainTracksProps() {
		let uiAlgo = 'jetpack-instant-search-ui/v1';
		if ( this.props.resultFormat === RESULT_FORMAT_PRODUCT ) {
			uiAlgo = uiAlgo + '-product';
		} else if ( this.props.resultFormat === RESULT_FORMAT_EXPANDED ) {
			uiAlgo = uiAlgo + '-expanded';
		} else {
			uiAlgo = uiAlgo + '-minimal';
		}
		if ( this.props.result.custom ) {
			uiAlgo = uiAlgo + '-custom';
		}
		return {
			fetch_algo: this.props.railcar.fetch_algo,
			fetch_position: this.props.railcar.fetch_position,
			fetch_query: this.props.railcar.fetch_query,
			railcar: this.props.railcar.railcar,
			rec_blog_id: this.props.railcar.rec_blog_id,
			rec_post_id: this.props.railcar.rec_post_id,
			session_id: this.props.railcar.session_id,
			ui_algo: uiAlgo,
			ui_position: this.props.index,
		};
	}

	onClick = () => {
		// Send out analytics call
		!! this.props.railcar &&
			recordTrainTracksInteract( { ...this.getCommonTrainTracksProps(), action: 'click' } );
	};

	render() {
		if ( this.props.resultFormat === RESULT_FORMAT_PRODUCT ) {
			return <SearchResultProduct onClick={ this.onClick } { ...this.props } />;
		} else if ( this.props.resultFormat === RESULT_FORMAT_EXPANDED ) {
			return <SearchResultExpanded onClick={ this.onClick } { ...this.props } />;
		}

		return <SearchResultMinimal onClick={ this.onClick } { ...this.props } />;
	}
}

export default SearchResult;
