/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * Dialog component.
 *
 * @param {object} props                    - Component props.
 * @param {React.Component} props.primary   - Primary content.
 * @param {React.Component} props.secondary - Secondary content.
 * @param {boolean} props.split			    - Split the sections.
 * @returns {object}                          Dialog react component.
 */
export default function Dialog( { primary, secondary, split } ) {
	const classNames = classnames( {
		[ styles.container ]: ! split,
	} );

	return (
		<Container className={ classNames } horizontalSpacing={ 0 } horizontalGap={ 0 } fluid>
			<Col sm={ 4 } md={ 4 } lg={ 7 } className={ styles.primary }>
				{ primary }
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 5 } className={ styles.secondary }>
				{ secondary }
			</Col>
		</Container>
	);
}

Dialog.propTypes = {
	split: PropTypes.bool,
};

Dialog.defaultProps = {
	primary: null,
	secondary: null,
	split: false,
};
