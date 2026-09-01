import clsx from 'clsx';
import { Children, Component } from 'react';

import './style.scss';

export default class ButtonGroup extends Component {
	static displayName = 'ButtonGroup';

	static propTypes = {
		children( props ) {
			let error = null;
			Children.forEach( props.children, child => {
				if ( ! child.props || child.props.type !== 'button' ) {
					error = new Error( 'All children elements should be a Button.' );
				}
			} );
			return error;
		},
	};

	render() {
		const buttonGroupClasses = clsx( 'dops-button-group', this.props.className );

		return <span className={ buttonGroupClasses }>{ this.props.children }</span>;
	}
}
