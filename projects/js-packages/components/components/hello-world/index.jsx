/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

const HelloWorld = props => (
	<div className="jetpack-hello-world">
		<a className="the-link">{ props.title }</a>
	</div>
);

HelloWorld.propTypes = {
	/**
	 * The title of the link
	 */
	title: PropTypes.string.isRequired,
};

HelloWorld.defaultProps = {
	title: 'default title',
};

export default HelloWorld;
