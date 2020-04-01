/* eslint-disable jsx-a11y/click-events-have-key-events */
/**
 * External dependencies
 */
import React from 'react';

import PureRenderMixin from 'react-pure-render/mixin';
import createReactClass from 'create-react-class';

/**
 * Internal dependencies
 */
import SelectDropdown from 'components/select-dropdown';

import DropdownItem from 'components/select-dropdown/item';
import DropdownLabel from 'components/select-dropdown/label';
import DropdownSeparator from 'components/select-dropdown/separator';

const SelectDropdownDemo = createReactClass( {
	displayName: 'SelectDropdown',

	mixins: [ PureRenderMixin ],

	getInitialState: function() {
		return {
			childSelected: 'Published',
			selectedCount: 10,
			compactButtons: false,
		};
	},

	getDefaultProps: function() {
		return {
			options: [
				{ value: 'status-options', label: 'Statuses', isLabel: true },
				{ value: 'published', label: 'Published' },
				{ value: 'scheduled', label: 'Scheduled' },
				{ value: 'drafts', label: 'Drafts' },
				null,
				{ value: 'trashed', label: 'Trashed' },
			],
		};
	},

	handleSelectItem: function( childSelected, count ) {
		return event => {
			event.preventDefault();
			this.selectItem( childSelected, count );
		};
	},

	toggleButtons: function() {
		this.setState( { compactButtons: ! this.state.compactButtons } );
	},

	render: function() {
		const toggleButtonsText = this.state.compactButtons ? 'Normal Buttons' : 'Compact Buttons';

		return (
			<div className="design-assets__group">
				<h2>
					<a href="/devdocs/design/select-dropdown">Select Dropdown</a>
					<a
						className="design-assets__toggle button"
						role="button"
						tabIndex={ 0 }
						onClick={ this.toggleButtons }
					>
						{ toggleButtonsText }
					</a>
				</h2>

				<h3>Items passed as options prop</h3>
				<SelectDropdown
					compact={ this.state.compactButtons }
					options={ this.props.options }
					onSelect={ this.onDropdownSelect }
				/>

				<h3 style={ { marginTop: 20 } }>Items passed as children</h3>
				<SelectDropdown
					compact={ this.state.compactButtons }
					onSelect={ this.onDropdownSelect }
					selectedText={ this.state.childSelected }
					selectedCount={ this.state.selectedCount }
				>
					<DropdownLabel>
						<strong>Statuses</strong>
					</DropdownLabel>

					<DropdownItem
						count={ 10 }
						selected={ this.state.childSelected === 'Published' }
						onClick={ this.handleSelectItem( 'Published', 10 ) }
					>
						Published
					</DropdownItem>

					<DropdownItem
						count={ 4 }
						selected={ this.state.childSelected === 'Scheduled' }
						onClick={ this.handleSelectItem( 'Scheduled', 4 ) }
					>
						Scheduled
					</DropdownItem>

					<DropdownItem
						selected={ this.state.childSelected === 'Drafts' }
						onClick={ this.handleSelectItem( 'Drafts', null ) }
					>
						Drafts
					</DropdownItem>

					<DropdownSeparator />

					<DropdownItem
						count={ 3 }
						selected={ this.state.childSelected === 'Trashed' }
						onClick={ this.handleSelectItem( 'Trashed', 3 ) }
					>
						Trashed
					</DropdownItem>
				</SelectDropdown>
			</div>
		);
	},

	selectItem: function( childSelected, count ) {
		this.setState( {
			childSelected: childSelected,
			selectedCount: count,
		} );
	},

	onDropdownSelect: function() {},
} );

export default SelectDropdownDemo;
