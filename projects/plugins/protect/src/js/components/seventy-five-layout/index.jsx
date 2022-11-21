import { Container, Col, useBreakpointMatch } from '@automattic/jetpack-components';
import { React } from 'react';

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
	const [ isSmall, isLarge ] = useBreakpointMatch( [ 'sm', 'lg' ] );

	/*
	 * By convention, secondary section is not shown when:
	 * - preserveSecondaryOnMobile is false
	 * - on mobile breakpoint (sm)
	 */
	const hideSecondarySection = ! preserveSecondaryOnMobile && isSmall;

	return (
		<Container horizontalSpacing={ 0 } horizontalGap={ 0 } fluid={ false }>
			{ ! hideSecondarySection && (
				<>
					<Col sm={ 12 } md={ 4 } lg={ 6 }>
						{ main }
					</Col>
					{ isLarge && <Col lg={ 1 } /> }
					<Col sm={ 12 } md={ 4 } lg={ 5 }>
						{ secondary }
					</Col>
				</>
			) }
			{ hideSecondarySection && <Col>{ main }</Col> }
		</Container>
	);
};

export default SeventyFiveLayout;
