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
	constructor( props ) {
		super( props );
		this.state = { selected: this.props.initialValue };
	}

	render() {
		const sortOptions = getSortOptions();
		return (
			<label>
				{ __( 'Sort by' ) }
				<select className="jetpack-instant-search__sort-widget-select">
					{ sortOptions.map( option => (
						<option
							key={ option.name }
							selected={ this.state.selected && this.state.selected === option.name }
						>
							{ option.label }
						</option>
					) ) }
				</select>
			</label>
		);
	}
}
