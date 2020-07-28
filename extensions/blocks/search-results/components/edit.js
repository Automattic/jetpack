/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice, TextControl, RadioControl, Placeholder } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import classNames from 'classnames';

/**
 * Internal dependencies
 */

class SearchResultsEdit extends Component {
	render() {
		return <div className={ this.props.className }>here are some awesome results</div>;
	}
}

export default withSelect( ( select, ownProps ) => {
	const { isBlockSelected, hasSelectedInnerBlock } = select( 'core/block-editor' );
	return {
		isSelected: isBlockSelected( ownProps.clientId ) || hasSelectedInnerBlock( ownProps.clientId ),
	};
} )( SearchResultsEdit );
