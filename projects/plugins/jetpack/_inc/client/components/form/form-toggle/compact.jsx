import clsx from 'clsx';
import { Component } from 'react';
import Toggle from 'components/form/form-toggle';

export default class CompactFormToggle extends Component {
	static displayName = 'CompactFormToggle';

	render() {
		return (
			<Toggle { ...this.props } className={ clsx( this.props.className, 'is-compact' ) }>
				{ this.props.children }
			</Toggle>
		);
	}
}
