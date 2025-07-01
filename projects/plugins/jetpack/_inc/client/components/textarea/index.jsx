import clsx from 'clsx';
import { omit } from 'lodash';
import { Component } from 'react';

import './style.scss';

export default class Textarea extends Component {
	static displayName = 'Textarea';

	render() {
		return (
			<textarea
				{ ...omit( this.props, 'className' ) }
				className={ clsx( this.props.className, 'dops-textarea' ) }
			>
				{ this.props.children }
			</textarea>
		);
	}
}
