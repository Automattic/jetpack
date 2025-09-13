import clsx from 'clsx';
import Col from '../layout/col/index.tsx';
import Container from '../layout/container/index.tsx';
import useBreakpointMatch from '../layout/use-breakpoint-match/index.ts';
import styles from './style.module.scss';
import type { ReactNode, FC } from 'react';

type DialogProps = {
	primary: ReactNode;
	secondary?: ReactNode;
	isTwoSections?: boolean;
	isCard?: boolean;
	containerProps: object;
};

/**
 * Dialog component.
 *
 * @param {object}    props                - React component props.
 * @param {ReactNode} props.primary        - Primary-section content.
 * @param {ReactNode} props.secondary      - Secondary-section content.
 * @param {boolean}   props.isTwoSections  - Handle two sections layout when true.
 * @param {object}    props.containerProps - Props to pass to the container component.
 * @return {ReactNode}                 Rendered dialog
 */
const Dialog: FC< DialogProps > = ( {
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
