/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResultMinimal from './search-result-minimal';
import SearchResultProduct from './search-result-product';
import { recordTrainTracksRender, recordTrainTracksInteract } from '../lib/tracks';
import { RESULT_FORMAT_PRODUCT } from '../lib/constants';

class SearchResult extends Component {
	componentDidMount() {
		recordTrainTracksRender( this.getCommonTrainTracksProps() );
	}

	getCommonTrainTracksProps() {
		return {
			fetch_algo: this.props.result.railcar.fetch_algo,
			fetch_position: this.props.result.railcar.fetch_position,
			fetch_query: this.props.result.railcar.fetch_query,
			railcar: this.props.result.railcar.railcar,
			rec_blog_id: this.props.result.railcar.rec_blog_id,
			rec_post_id: this.props.result.railcar.rec_post_id,
			ui_algo: 'jetpack-instant-search-ui/v1',
			ui_position: this.props.index,
		};
	}

	onClick = () => {
		// Send out analytics call
		recordTrainTracksInteract( { ...this.getCommonTrainTracksProps(), action: 'click' } );
	};

	render() {
		if ( this.props.resultFormat === RESULT_FORMAT_PRODUCT ) {
			return <SearchResultProduct { ...this.props } />;
		}

		return <SearchResultMinimal { ...this.props } />;
	}
}

export default SearchResult;
