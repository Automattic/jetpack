/**
 * External dependencies
 */
import React from 'react';
/*eslint lodash/import-scope: [2, "method"]*/
import assign from 'lodash/assign';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Card from 'components/card';

export default class CompactCard extends React.Component {
	static displayName = 'CompactCard';

	render() {
		const props = assign( {}, this.props, {
			className: classnames( this.props.className, 'is-compact' ),
		} );

		return <Card { ...props }>{ this.props.children }</Card>;
	}
}
