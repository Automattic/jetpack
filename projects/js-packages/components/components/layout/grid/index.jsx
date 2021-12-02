/**
 * External dependencies
 */
import React from 'react';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * This is the wrapper component to build sections within your admin page.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Grid component.
 */
const Grid = props => {
	const { children, sm, md, lg } = props;
	const className = classnames(
		styles[ 'sm-col-span-' + sm ],
		styles[ 'md-col-span-' + md ],
		styles[ 'lg-col-span-' + lg ]
	);
	return <div className={ className }>{ children }</div>;
};

export default Grid;
