/**
 * External dependencies
 */
import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * The basic Grid component.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Grid component.
 */
const Grid = props => {
	const { children, sm, md, lg } = props;
	const minimum = [ sm, md, lg ].reduce( ( prev, curr ) => ( curr < prev ? curr : prev ) );
	const className = classnames(
		typeof sm !== 'undefined' ? styles[ 'sm-col-span-' + sm ] : styles[ 'sm-col-span-' + minimum ],
		typeof md !== 'undefined' ? styles[ 'md-col-span-' + md ] : styles[ 'md-col-span-' + minimum ],
		typeof lg !== 'undefined' ? styles[ 'lg-col-span-' + lg ] : styles[ 'lg-col-span-' + minimum ]
	);
	return <div className={ className }>{ children }</div>;
};

Grid.proptypes = {
	/** Colspan for small viewport. Defaults to the smallest colspan informed. */
	sm: PropTypes.number,
	/** Colspan for medium viewport. Defaults to the smallest colspan informed. */
	md: PropTypes.number,
	/** Colspan for large viewport. Defaults to the smallest colspan informed. */
	lg: PropTypes.number,
};

export default Grid;
