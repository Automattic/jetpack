/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

class SearchResult extends Component {
	render() {
		const { result } = this.props;
		return <p>{ result.fields.author }</p>;
	}
}

export default SearchResult;
