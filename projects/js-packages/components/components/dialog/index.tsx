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
	twoColumns?: boolean;
};

/**
 * Dialog component.
 *
 * @param {object} props                    - React component props.
 * @param {React.ReactNode} props.primary   - Primary content.
 * @param {React.ReactNode} props.secondary - Secondary content.
 * @param {boolean} props.twoColumns        - Whether to display the dialog in two columns.
 * @returns {React.ReactNode}                 Rendered dialog
 */
const Dialog: React.FC< DialogProps > = ( { primary, secondary, twoColumns = false } ) => {
	const classNames = classnames( {
		[ styles[ 'one-column-style' ] ]: ! twoColumns,
	} );

	return (
		<Container className={ classNames } horizontalSpacing={ 0 } horizontalGap={ 0 } fluid>
			<Col sm={ 4 } md={ 5 } lg={ 7 } className={ styles.primary }>
				{ primary }
			</Col>
			<Col sm={ 4 } md={ 3 } lg={ 5 } className={ styles.secondary }>
				{ secondary }
			</Col>
		</Container>
	);
};

export default Dialog;
