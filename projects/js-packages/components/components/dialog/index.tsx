import clsx from 'clsx';
import React from 'react';
import Col from '../layout/col';
import Container from '../layout/container';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import styles from './style.module.scss';

type DialogProps = {
	primary: React.ReactNode;
	secondary?: React.ReactNode;
	isTwoSections?: boolean;
	isCard?: boolean;
	containerProps: object;
};

/**
 * Dialog component.
 *
 * @param {object} props                    - React component props.
 * @param {React.ReactNode} props.primary   - Primary-section content.
 * @param {React.ReactNode} props.secondary - Secondary-section content.
 * @param {boolean} props.isTwoSections     - Handle two sections layout when true.
 * @param {object} props.containerProps     - Props to pass to the container component.
 * @returns {React.ReactNode}                 Rendered dialog
 */
const Dialog: React.FC< DialogProps > = ( {
	primary,
	secondary,
	isTwoSections = false,
	...containerProps
} ) => {
	const [ isSmall, isLowerThanLarge ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	/*
	 * By convention, secondary section is not shown when:
	 * - layout is a two-sections setup
	 * - on mobile breakpoint (sm)
	 */
	const hideSecondarySection = ! isTwoSections && isSmall;

	const classNames = clsx( {
		[ styles[ 'one-section-style' ] ]: ! isTwoSections,
		[ styles[ 'is-viewport-small' ] ]: isSmall,
	} );

	return (
		<Container
			className={ classNames }
			horizontalSpacing={ 0 }
			horizontalGap={ 0 }
			fluid={ false }
			{ ...containerProps }
		>
			{ ! hideSecondarySection && (
				<>
					<Col sm={ 4 } md={ isLowerThanLarge ? 4 : 5 } lg={ 7 } className={ styles.primary }>
						{ primary }
					</Col>
					<Col sm={ 4 } md={ isLowerThanLarge ? 4 : 3 } lg={ 5 } className={ styles.secondary }>
						{ secondary }
					</Col>
				</>
			) }
			{ hideSecondarySection && <Col>{ primary }</Col> }
		</Container>
	);
};

export default Dialog;
