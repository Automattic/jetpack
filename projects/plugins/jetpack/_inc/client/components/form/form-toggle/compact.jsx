import clsx from 'clsx';
import { omit } from 'lodash';
import { Component } from 'react';
import Toggle from 'components/form/form-toggle';

export default class CompactFormToggle extends Component {
	static displayName = 'CompactFormToggle';

	render() {
		return (
			<Toggle
				{ ...omit( this.props, 'className' ) }
				className={ clsx( this.props.className, 'is-compact' ) }
			>
				{ this.props.children }
			</Toggle>
		);
	}
}
