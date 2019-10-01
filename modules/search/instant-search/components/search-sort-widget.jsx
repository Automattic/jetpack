/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

export default class SearchSortWidget extends Component {
	render() {
		return (
			<select className="jetpack-instant-search__sort-widget">
				<option>one</option>
				<option>two</option>
				<option>three</option>
			</select>
		);
	}
}
