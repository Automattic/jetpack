/*eslint lodash/import-scope: [2, "method"]*/
import clsx from 'clsx';
import assign from 'lodash/assign';
import { Component } from 'react';
import Card from 'components/card';

export default class CompactCard extends Component {
	static displayName = 'CompactCard';

	render() {
		const props = assign( {}, this.props, {
			className: clsx( this.props.className, 'is-compact' ),
		} );

		return <Card { ...props }>{ this.props.children }</Card>;
	}
}
