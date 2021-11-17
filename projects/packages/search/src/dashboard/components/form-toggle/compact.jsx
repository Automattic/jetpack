/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import Toggle from 'components/form-toggle';

export default class CompactFormToggle extends React.Component {
	static displayName = 'CompactFormToggle';

	render() {
		return (
			<Toggle
				{ ...omit( this.props, 'className' ) }
				className={ classNames( this.props.className, 'is-compact' ) }
			>
				{ this.props.children }
			</Toggle>
		);
	}
}
