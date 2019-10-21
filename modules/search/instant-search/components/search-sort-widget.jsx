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
	handleChange = event => {
		if ( this.props.value === event.target.value ) {
			return;
		}

		this.props.onChange( event.target.value );
	};

	render() {
		const sortOptions = getSortOptions();
		return (
			<label>
				{ __( 'Sort by', 'jetpack' ) }
				<select
					className="jetpack-instant-search__sort-widget-select"
					onBlur={ this.handleChange }
					onChange={ this.handleChange }
				>
					{ Object.keys( sortOptions ).map( sortKey => (
						<option value={ sortKey } selected={ this.props.value === sortKey }>
							{ sortOptions[ sortKey ].label }
						</option>
					) ) }
				</select>
			</label>
		);
	}
}
