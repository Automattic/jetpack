/// <reference types="jest" />

import { render, screen } from '@testing-library/react';
import { stage as OnboardingStage } from '../../../../routes/newsletter-mode-onboarding/stage';
import { stage as StatsStage } from '../../../../routes/newsletter-mode-stats/stage';

describe.each( [
	[ 'onboarding', OnboardingStage, 'Newsletter setup' ],
	[ 'stats', StatsStage, 'Stats dashboard' ],
] )( '%s route', ( _route, Stage, placeholderTitle ) => {
	it( 'renders its content inside the shared AdminPage shell', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'heading', { level: 1, name: 'Newsletter' } ) ).toBeVisible();
		expect( screen.getByRole( 'heading', { level: 2, name: placeholderTitle } ) ).toBeVisible();
		expect( screen.getByText( 'Create, grow, and manage your newsletter.' ) ).toBeVisible();
		expect( screen.getByRole( 'contentinfo', { name: 'Jetpack' } ) ).toBeVisible();
	} );
} );
