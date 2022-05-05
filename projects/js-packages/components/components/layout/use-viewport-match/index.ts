/**
 * External dependencies
 */
import { useMediaQuery } from '@wordpress/compose';
import breakpoints from '../breakpoints.module.scss';

type Breakpoints = 'sm' | 'md' | 'lg';

type Operators = '<' | '<=' | '>' | '>=';

type MediaQuery = `(min-width: ${ string })` | `(max-width: ${ string })`;

const getMediaByOperator = ( breakpoint: Breakpoints, operator: Operators ): MediaQuery => {
	const breakpointValue: string = breakpoints[ breakpoint ];

	if ( operator.startsWith( '<' ) ) {
		return `(max-width: ${ breakpointValue })`;
	}

	return `(min-width: ${ breakpointValue })`;
};

const useBreakpointMatch = ( breakpoint: Breakpoints, operator: Operators ) => {
	const media = operator ? getMediaByOperator( breakpoint, operator ) : breakpoints[ breakpoint ];
	const matches = useMediaQuery( media );
	return matches;
};

export default useBreakpointMatch;
