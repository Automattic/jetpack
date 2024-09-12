import clsx from 'clsx';
import { omit } from 'lodash';
import React from 'react';

import './style.scss';

export default class Textarea extends React.Component {
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
