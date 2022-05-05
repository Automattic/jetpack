/**
 * External dependencies
 */
import { useMediaQuery } from '@wordpress/compose';
import breakpointsValues from '../breakpoints.module.scss';

const BREAKPOINTS = [ 'sm', 'md', 'lg' ] as const;

type Breakpoints = typeof BREAKPOINTS[ number ];

type Operators = '<' | '<=' | '>' | '>=';

type Matches = { sm: boolean; md: boolean; lg: boolean };

const getMediaByOperator = (
	breakpoint: Breakpoints,
	operator: Operators,
	matches: Matches
): boolean => {
	const breakpointIndex = BREAKPOINTS.indexOf( breakpoint );
	const breakpointIndexPlusOne = breakpointIndex + 1;
	const isEqual = operator.includes( '=' );

	let allNeededBreakpoints = [];

	if ( operator.startsWith( '<' ) ) {
		allNeededBreakpoints = BREAKPOINTS.slice(
			0,
			isEqual ? breakpointIndexPlusOne : breakpointIndex
		);
	}

	if ( operator.startsWith( '>' ) ) {
		allNeededBreakpoints = BREAKPOINTS.slice( isEqual ? breakpointIndex : breakpointIndexPlusOne );
	}

	return allNeededBreakpoints?.length
		? allNeededBreakpoints.some( brk => matches[ brk ] )
		: matches[ breakpoint ];
};

const useBreakpointMatch = (
	breakpointToMatch: Breakpoints | Array< Breakpoints >,
	operatorToMatch?: Operators | Array< Operators >
) => {
	const breakpoints: Array< Breakpoints > = Array.isArray( breakpointToMatch )
		? breakpointToMatch
		: [ breakpointToMatch ];

	const operators: Array< Operators > = Array.isArray( operatorToMatch )
		? operatorToMatch
		: [ operatorToMatch ];

	const [ smKey, mdKey, lgKey ] = BREAKPOINTS;

	const sm = useMediaQuery( breakpointsValues[ smKey ] );
	const md = useMediaQuery( breakpointsValues[ mdKey ] );
	const lg = useMediaQuery( breakpointsValues[ lgKey ] );

	const matches: Matches = { sm, md, lg };

	return breakpoints.map( ( breakpoint, idx ) => {
		const operator = operators[ idx ];
		return operator ? getMediaByOperator( breakpoint, operator, matches ) : matches[ breakpoint ];
	} );
};

export default useBreakpointMatch;
