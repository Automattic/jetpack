import clsx from 'clsx';
import { Component } from 'react';

import './style.scss';

export default class Textarea extends Component {
	static displayName = 'Textarea';

	render() {
		return (
			<textarea { ...this.props } className={ clsx( this.props.className, 'dops-textarea' ) }>
				{ this.props.children }
			</textarea>
		);
	}
}
