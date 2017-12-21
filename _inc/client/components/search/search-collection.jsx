/**
* External dependencies
*/
import React from 'react';

const Hider = React.createClass( {
	displayName: 'Hider',

	propTypes: {
		hide: React.PropTypes.bool,
	},

	render() {
		return (
			<div
				className={ 'design-assets__group' }
				style={ this.props.hide ? { display: 'none' } : {} }
			>
				{ this.props.children }
			</div>
		);
	}
} );

const FilterSummary = React.createClass( {
	getDefaultProps: function() {
		return {
			noResultsText: 'No Results Found'
		};
	},

	propTypes: {
		noResultsText: React.PropTypes.string
	},

	render() {
		if ( this.props.items.length === 0 ) {
			return ( <p>{ this.props.noResultsText }</p> );
		} else {
			return null;
		}
	}
} );

export default React.createClass( {
	displayName: 'Collection',

	shouldWeHide: function( example ) {
		let filter, searchString;

		filter = this.props.filter || '';

		searchString = example.props.searchTerms;

		if ( this.props.component ) {
			return example.type.displayName.toLowerCase() !== this.props.component.replace( /-([a-z])/g, '$1' );
		}

		if ( example.props.searchKeywords ) {
			searchString += ' ' + example.props.searchKeywords;
		}

		return ! ( ! filter || searchString.toLowerCase().indexOf( filter ) > -1 );
	},

	visibleExamples: function( examples ) {
		return examples.filter( ( child ) => {
			return !child.props.hide;
		} );
	},

	render: function() {
		let summary, examples;

		examples = React.Children.map( this.props.children, ( example ) => {
			return (
				<Hider hide={ this.shouldWeHide( example ) } key={ 'example-' + example.type.displayName }>
					{ example }
				</Hider>
			);
		} );

		if ( ! this.props.component ) {
			summary = (
				<FilterSummary
					items={ this.visibleExamples( examples ) }
					total={ this.props.children.length }
					noResultsText={ this.props.noResultsText }
				/>
			);
		}

		return (
			<div className="collection">
				{ summary }
				{ examples }
			</div>
		);
	}
} );
