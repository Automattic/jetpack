/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import Portal from 'preact-portal';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

class SearchWidget extends Component {
	constructor() {
		super( ...arguments );
		this.requestId = 0;
		this.state = {
			query: this.props.initialValue,
			results: [],
		};
		this.onChangeQuery = this.onChangeQuery.bind( this );
		this.getResults = debounce( this.getResults.bind( this ), 500 );
		this.getResults( this.props.initialValue );
	}
	componentDidMount() {
		if ( this.props.grabFocus ) {
			this.input.focus();
		}
	}

	bindInput = input => ( this.input = input );
	onChangeQuery = event => {
		const query = event.target.value;
		this.setState( { query } );
		this.getResults( query );
	};

	getResults( query ) {
		if ( query ) {
			const { api } = this.props;
			if ( api ) {
				this.requestId++;
				const requestId = this.requestId;
				api
					.fetch( query )
					.then( response => {
						return response.json();
					} )
					.then( json => {
						if ( this.requestId === requestId ) {
							this.setState( { results: json } );
						}
					} );
			}
		} else {
			this.setState( { results: [] } );
		}
	}

	render() {
		const { query, results } = this.state;
		const { SearchResults, api } = this.props;
		return (
			<div>
				<p>
					<input
						type="search"
						value={ query }
						onInput={ this.onChangeQuery }
						ref={ this.bindInput }
					/>
				</p>
				<Portal into="#results">
					<SearchResults api={ api } query={ query } { ...results } />
				</Portal>
			</div>
		);
	}
}

export default SearchWidget;
