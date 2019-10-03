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
		this.handleChange = this.handleChange.bind( this );
	}

	handleChange( event ) {
		this.setState( { selected: event.target.value }, () => {
			this.props.onChange( event.target.value );
		} );
	}

	render() {
		const sortOptions = getSortOptions();
		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<label>
				{ __( 'Sort by' ) }
				<select
					className="jetpack-instant-search__sort-widget-select"
					onChange={ this.handleChange }
				>
					{ Object.keys( sortOptions ).map( key => (
						<option value={ key } selected={ this.state.selected && this.state.selected === key }>
							{ sortOptions[ key ].label }
						</option>
					) ) }
				</select>
			</label>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}
