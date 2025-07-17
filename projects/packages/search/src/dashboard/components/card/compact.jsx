import clsx from 'clsx';
import { Component } from 'react';
import Card from 'components/card';

export default class CompactCard extends Component {
	static displayName = 'CompactCard';

	render() {
		const props = {
			...this.props,
			className: clsx( this.props.className, 'is-compact' ),
		};

		return <Card { ...props }>{ this.props.children }</Card>;
	}
}
