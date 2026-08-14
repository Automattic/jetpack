import { render, renderHook, screen } from '@testing-library/react';
import { useRef, useState, useLayoutEffect } from 'react';
import { ChartScopeContext, useChartScopeElement } from '../index';
import type { ReactNode } from 'react';

const Probe = () => {
	const element = useChartScopeElement();
	return <span data-testid="probe">{ element ? element.id : 'none' }</span>;
};

const Scope = ( { id, children }: { id: string; children: ReactNode } ) => {
	const ref = useRef< HTMLDivElement >( null );
	const [ node, setNode ] = useState< HTMLElement | null >( null );
	useLayoutEffect( () => setNode( ref.current ), [] );
	return (
		<div ref={ ref } id={ id }>
			<ChartScopeContext.Provider value={ node }>{ children }</ChartScopeContext.Provider>
		</div>
	);
};

describe( 'useChartScopeElement', () => {
	it( 'returns null with no scope above it', () => {
		const { result } = renderHook( () => useChartScopeElement() );
		expect( result.current ).toBeNull();
	} );

	it( 'returns the enclosing scope element', () => {
		render(
			<Scope id="outer">
				<Probe />
			</Scope>
		);
		expect( screen.getByTestId( 'probe' ) ).toHaveTextContent( 'outer' );
	} );

	it( 'returns the nearest scope when scopes nest', () => {
		render(
			<Scope id="outer">
				<Scope id="inner">
					<Probe />
				</Scope>
			</Scope>
		);
		expect( screen.getByTestId( 'probe' ) ).toHaveTextContent( 'inner' );
	} );
} );
