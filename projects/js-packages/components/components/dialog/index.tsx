/**
 * External dependencies
 */
import React from 'react';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import Container from '../layout/container';
import Col from '../layout/col';

type DialogProps = {
	primary: React.ReactNode;
	secondary: React.ReactNode;
	split?: boolean;
};

/**
 * Dialog component.
 *
 * @param {object} props                    - React component props.
 * @param {React.ReactNode} props.primary   - Primary content.
 * @param {React.ReactNode} props.secondary - Secondary content.
 * @param {boolean} props.split			    - Split the sections.
 * @returns {React.ReactNode}                 Rendered dialog
 */
const Dialog: React.FC< DialogProps > = ( { primary, secondary, split = false } ) => {
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
};

export default Dialog;
