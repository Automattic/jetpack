import clsx from 'clsx';
import Toggle from 'components/form/form-toggle';
import { omit } from 'lodash';
import React from 'react';

export default class CompactFormToggle extends React.Component {
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
