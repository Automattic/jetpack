/**
 * External dependencies
 */
import classNames from 'classnames';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getJitm } from 'state/jitm';

class Jitm extends Component {
	componentDidMount() {
		analytics.tracks.recordEvent(
			'jetpack_jitm_view',
			// replace by unique ID of the JITM.
			{ version: this.props.version }
		);
	}

	render() {
		const classes = classNames(
			this.props.className,
			'jitm-card jitm-banner'
		);
		return (
			<div className={ classes } role="dialog">
				{ this.props.content }
			</div>
		);
	}
}

Jitm.propTypes = {
	content: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.object,
	] ).isRequired,
};

Jitm.defaultProps = {
	content: '',
};

export default connect(
	state => {
		return {
			Jitm: getJitm( state ),
		};
	}
)( Jitm );
