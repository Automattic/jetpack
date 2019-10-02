/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSortOptions } from '../lib/sort';

export default class SearchSortWidget extends Component {
	render() {
		const sortOptions = getSortOptions();
		return (
			<label>
				{ __( 'Sort by' ) }
				<select className="jetpack-instant-search__sort-widget-select">
					{ sortOptions.map( option => (
						<option key={ option.name }>{ option.label }</option>
					) ) }
				</select>
			</label>
		);
	}
}
