import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';

export class LoadingPlaceholder extends React.Component {
	static displayName = 'LoadingPlaceholder';

	render() {
		const classes = classNames( this.props.className, 'jp-loading-placeholder' );

		return (
			<div className={ classes }>
				<span className="dashicons dashicons-wordpress-alt" />
			</div>
		);
	}
}

export default connect( state => {
	return state;
} )( LoadingPlaceholder );
