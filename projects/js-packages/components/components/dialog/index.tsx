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
import useBreakpointMatch from '../layout/use-breakpoint-match';

type DialogProps = {
	primary: React.ReactNode;
	secondary?: React.ReactNode;
	isTwoSections?: boolean;
};

/**
 * Dialog component.
 *
 * @param {object} props                    - React component props.
 * @param {React.ReactNode} props.primary   - Primary-section content.
 * @param {React.ReactNode} props.secondary - Secondary-section content.
 * @param {boolean} props.isTwoSections     - Handle two sections layout when true.
 * @returns {React.ReactNode}                 Rendered dialog
 */
const Dialog: React.FC< DialogProps > = ( { primary, secondary, isTwoSections = false } ) => {
	const classNames = classnames( {
		[ styles[ 'one-section-style' ] ]: ! isTwoSections,
	} );

	/*
	 * By convention, secondary section is not shown when:
	 * - layout is two sections
	 * - on mobile breakpoint (sm)
	 */
	const [ isSmallBreakpoint ] = useBreakpointMatch( 'sm' );
	const hideSecondarySection = ! isTwoSections && isSmallBreakpoint;

	return (
		<Container className={ classNames } horizontalSpacing={ 0 } horizontalGap={ 0 } fluid>
			{ ! hideSecondarySection && (
				<>
					<Col sm={ 4 } md={ 5 } lg={ 7 } className={ styles.primary }>
						{ primary }
					</Col>
					<Col sm={ 4 } md={ 3 } lg={ 5 } className={ styles.secondary }>
						{ secondary }
					</Col>
				</>
			) }
			{ hideSecondarySection && <Col>{ primary }</Col> }
		</Container>
	);
};

export default Dialog;
