import { Container, Col, useBreakpointMatch } from '@automattic/jetpack-components';
import classnames from 'classnames';
import React from 'react';
import styles from './styles.module.scss';

/**
 * SeventyFive layout meta component
 * The component name references to
 * the sections disposition of the layout.
 * FiftyFifty, 75, thus 7|5 means the cols numbers
 * for main and secondary sections respectively,
 * in large lg viewport size.
 *
 * @param {object} props                            - Component props
 * @param {React.ReactNode} props.main              - Main section component
 * @param {React.ReactNode} props.secondary         - Secondary section component
 * @param {boolean} props.preserveSecondaryOnMobile - Whether to show secondary section on mobile
 * @returns {React.ReactNode} 					    - React meta-component
 */
const SeventyFiveLayout = ( { main, secondary, preserveSecondaryOnMobile = false } ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const classNames = classnames( {
		[ styles[ 'is-viewport-small' ] ]: isSmall,
	} );

	/*
	 * By convention, secondary section is not shown when:
	 * - preserveSecondaryOnMobile is false
	 * - on mobile breakpoint (sm)
	 */
	const hideSecondarySection = ! preserveSecondaryOnMobile && isSmall;

	return (
		<Container className={ classNames } horizontalSpacing={ 0 } horizontalGap={ 0 } fluid={ false }>
			{ ! hideSecondarySection && (
				<>
					<Col sm={ 4 } md={ 4 } className={ styles.main }>
						{ main }
					</Col>
					<Col sm={ 4 } md={ 4 } className={ styles.secondary }>
						{ secondary }
					</Col>
				</>
			) }
			{ hideSecondarySection && <Col>{ main }</Col> }
		</Container>
	);
};

export default SeventyFiveLayout;
