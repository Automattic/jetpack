import { render, screen } from '@testing-library/react';
import IconTooltip from '../index';
import { IconTooltipProps } from '../types';

describe( 'IconTooltip', () => {
	const testProps: IconTooltipProps = {
		title: 'Title',
		children: <div>Content block</div>,
	};

	it( 'renders the icon tooltip', () => {
		render( <IconTooltip { ...testProps } /> );
		expect( screen.getByTestId( 'icon-tooltip_wrapper' ) ).toBeInTheDocument();
	} );
} );
