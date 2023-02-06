import PropTypes from 'prop-types';
import React from 'react';

class Hider extends React.Component {
	static displayName = 'Hider';

	static propTypes = {
		hide: PropTypes.bool,
	};

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
}

class FilterSummary extends React.Component {
	static defaultProps = {
		noResultsText: 'No Results Found',
	};

	static propTypes = {
		noResultsText: PropTypes.string,
	};

	render() {
		if ( this.props.items.length === 0 ) {
			return <p>{ this.props.noResultsText }</p>;
		}
		return null;
	}
}

export default class Collection extends React.Component {
	static displayName = 'Collection';

	shouldWeHide = example => {
		const filter = this.props.filter || '';
		let searchString = example.props.searchTerms;

		if ( this.props.component ) {
			return (
				example.type.displayName.toLowerCase() !== this.props.component.replace( /-([a-z])/g, '$1' )
			);
		}

		if ( example.props.searchKeywords ) {
			searchString += ' ' + example.props.searchKeywords;
		}

		return ! ( ! filter || searchString.toLowerCase().indexOf( filter ) > -1 );
	};

	visibleExamples = examples => {
		return examples.filter( child => {
			return ! child.props.hide;
		} );
	};

	render() {
		const examples = React.Children.map( this.props.children, example => {
			return (
				<Hider hide={ this.shouldWeHide( example ) } key={ 'example-' + example.type.displayName }>
					{ example }
				</Hider>
			);
		} );
		let summary;

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
}
