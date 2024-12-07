import { Col, useBreakpointMatch } from '@automattic/jetpack-components';
import React from 'react';
import styles from './styles.module.scss';

// Define the props interface for the FlexLayout component
interface SeventyFiveLayoutProps {
	main: React.ReactNode;
	mainClassName?: string;
	secondary: React.ReactNode;
	secondaryClassName?: string;
	preserveSecondaryOnMobile?: boolean;
}

/**
 * FlexLayout component
 *
 * @param {object}          props                           - Component props
 * @param {React.ReactNode} props.main                      - Main section component
 * @param {string}          props.mainClassName             - Main section class name
 * @param {React.ReactNode} props.secondary                 - Secondary section component
 * @param {string}          props.secondaryClassName        - Secondary section class name
 * @param {boolean}         props.preserveSecondaryOnMobile - Whether to show secondary section on mobile
 * @return {React.ReactNode} - React meta-component
 */
const FlexLayout: React.FC< SeventyFiveLayoutProps > = ( {
	main,
	mainClassName,
	secondary,
	secondaryClassName,
	preserveSecondaryOnMobile = false,
} ) => {
	// Ensure the correct typing for useBreakpointMatch
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ] );

	/*
	 * By convention, secondary section is not shown when:
	 * - .preserveSecondaryOnMobile is false
	 * - on mobile breakpoint (sm)
	 */
	const hideSecondarySection = ! preserveSecondaryOnMobile && isSmall;

	return (
		<div className={ styles.container }>
			{ hideSecondarySection ? (
				<Col>{ main }</Col>
			) : (
				<>
					<Col className={ `${ styles.col } ${ mainClassName }` }>{ main }</Col>
					<Col className={ `${ styles.col } ${ secondaryClassName }` }>{ secondary }</Col>
				</>
			) }
		</div>
	);
};

export default FlexLayout;
