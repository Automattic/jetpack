/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import Button from '../button';

export default class Submit extends React.Component {
	static displayName = 'Submit';

	render() {
		const { ...other } = this.props;

		return (
			<Button { ...other } type="submit">
				{ this.props.children }
			</Button>
		);
	}
}
