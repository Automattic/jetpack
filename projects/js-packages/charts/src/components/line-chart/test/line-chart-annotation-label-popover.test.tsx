/* eslint-disable react/jsx-no-bind */
/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import LineChartAnnotationLabelWithPopover from '../line-chart-annotation-label-popover';

function renderLabel( { title, subtitle } ) {
	return (
		<span>
			<span>{ title }</span>
			<span>{ subtitle }</span>
		</span>
	);
}

function renderLabelPopover( { title, subtitle } ) {
	return (
		<div>
			<h4>{ title }</h4>
			<p>{ subtitle }</p>
		</div>
	);
}

describe( 'LineChartAnnotationLabelWithPopover', () => {
	it( 'should render the label', () => {
		render(
			<LineChartAnnotationLabelWithPopover
				title="Title"
				subtitle="Subtitle"
				renderLabel={ renderLabel }
				renderLabelPopover={ () => null }
			/>
		);
		expect( screen.getByText( 'Title' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Subtitle' ) ).toBeInTheDocument();
	} );

	it( 'should render the popover', () => {
		render(
			<LineChartAnnotationLabelWithPopover
				title="Title"
				subtitle="Subtitle"
				renderLabel={ () => null }
				renderLabelPopover={ renderLabelPopover }
			/>
		);
		expect( screen.getByText( 'Title' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Subtitle' ) ).toBeInTheDocument();
	} );

	it( 'should render popover with correct attributes and button targeting', async () => {
		render(
			<LineChartAnnotationLabelWithPopover
				title="Title"
				subtitle="Subtitle"
				renderLabel={ () => <span>Label</span> }
				renderLabelPopover={ renderLabelPopover }
			/>
		);

		const popover = screen.getByTestId( 'line-chart-annotation-label-popover' );
		const button = screen.getByRole( 'button', { name: /see details/i } );

		// Popover should have correct attributes
		expect( popover ).toHaveAttribute( 'popover', 'auto' );
		expect( popover ).toHaveAttribute( 'id' );

		// Button should target the popover
		const popoverId = popover.getAttribute( 'id' );
		expect( button ).toHaveAttribute( 'popovertarget', popoverId );

		// Popover content should be rendered
		expect( screen.getByRole( 'heading', { level: 4, name: 'Title' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Subtitle' ) ).toBeInTheDocument();

		// Close button should exist and target the same popover
		const closeButton = screen.getByRole( 'button', { name: /close/i } );
		expect( closeButton ).toHaveAttribute( 'popovertarget', popoverId );
		expect( closeButton ).toHaveAttribute( 'popovertargetaction', 'hide' );
	} );
} );
