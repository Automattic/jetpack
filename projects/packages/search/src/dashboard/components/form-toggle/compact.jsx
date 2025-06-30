import clsx from 'clsx';
/*eslint lodash/import-scope: [2, "method"]*/
import Toggle from 'components/form-toggle';
import omit from 'lodash/omit';
import { Component } from 'react';

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
