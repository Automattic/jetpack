/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	ReportParamsField,
	reportParamsAttributeField,
	type ReportParamsFieldAttributes,
} from '../report-params-field';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';
import type { ComponentType } from 'react';

// The stylesheets are stubbed, so the look a trigger was given is read off the
// props it received rather than off classes the Button never gets.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );
	const { createElement, forwardRef } = jest.requireActual( 'react' );
	const recordLook = ( Component: unknown ) =>
		forwardRef( ( { size, ...props }: Record< string, unknown >, ref: unknown ) =>
			createElement( Component, { ...props, ref, 'data-size': size } )
		);

	return {
		...actual,
		Button: recordLook( actual.Button ),
	};
} );

const ATTRIBUTES: ReportParamsFieldAttributes = { reportParams: { preset: 'last-7-days' } };
const FIELD = { id: 'reportParams', label: 'Date range' } as unknown as DataFormControlProps<
	Partial< ReportParamsFieldAttributes >
>[ 'field' ];

const trigger = () => screen.getByRole( 'button', { name: /^Last 7 days$/ } );

describe( 'report params trigger', () => {
	it( 'keeps the panel default size on a page field', () => {
		render( <ReportParamsField data={ ATTRIBUTES } field={ FIELD } onChange={ jest.fn() } /> );

		expect( trigger() ).not.toHaveAttribute( 'data-size' );
	} );

	it( 'is compact on a widget-owned control', () => {
		const { Edit } = reportParamsAttributeField< ReportParamsFieldAttributes >();
		const WidgetField = Edit as ComponentType<
			DataFormControlProps< ReportParamsFieldAttributes >
		>;

		render(
			<WidgetField
				{ ...( {
					data: ATTRIBUTES,
					field: FIELD,
					onChange: jest.fn(),
				} as unknown as DataFormControlProps< ReportParamsFieldAttributes > ) }
			/>
		);

		expect( trigger() ).toHaveAttribute( 'data-size', 'compact' );
	} );
} );
