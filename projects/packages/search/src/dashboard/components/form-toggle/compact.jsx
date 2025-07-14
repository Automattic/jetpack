import clsx from 'clsx';
/*eslint lodash/import-scope: [2, "method"]*/
import { Component } from 'react';
import Toggle from 'components/form-toggle';

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
