/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { recordBoostEvent } from '../../app/assets/src/js/lib/utils/analytics';
import { useDismissibleAlertState } from './lib/use-performance-history';
import ScoreAlert from './score-alert';

jest.mock( './lib/use-performance-history', () => ( {
	useDismissibleAlertState: jest.fn(),
} ) );
jest.mock( '../../app/assets/src/js/lib/utils/analytics', () => ( {
	recordBoostEvent: jest.fn(),
} ) );
jest.mock( '@react-spring/web', () => ( {
	animated: { div: 'div' },
	useSpring: ( { to }: { to: { right: string } } ) => ( {
		visibility: to.right === '0%' ? 'visible' : 'hidden',
	} ),
} ) );

const dismissAlert = jest.fn();

beforeEach( () => {
	jest.clearAllMocks();
	jest.mocked( useDismissibleAlertState ).mockReturnValue( [ false, dismissAlert ] );
} );

test( 'records one impression per score change when the retained Overview becomes visible', () => {
	const { rerender } = render( <ScoreAlert scoreChange={ 10 } isVisible={ false } /> );
	expect( screen.getByText( 'Your site got faster' ) ).not.toBeVisible();
	expect( recordBoostEvent ).not.toHaveBeenCalled();
	rerender( <ScoreAlert scoreChange={ 10 } isVisible /> );
	expect( screen.getByText( 'Your site got faster' ) ).toBeVisible();
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'speed_score_alert_shown', {
		score_direction: 'up',
	} );
	rerender( <ScoreAlert scoreChange={ 10 } isVisible={ false } /> );
	expect( screen.getByText( 'Your site got faster' ) ).not.toBeVisible();
	rerender( <ScoreAlert scoreChange={ 10 } isVisible /> );
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
	rerender( <ScoreAlert scoreChange={ 11 } isVisible /> );
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 2 );
} );

test( 'closing remains temporary and suppresses impressions when returning to Overview', () => {
	const { rerender } = render( <ScoreAlert scoreChange={ 10 } isVisible /> );
	fireEvent.click( screen.getByRole( 'link', { name: 'Dismiss' } ) );
	rerender( <ScoreAlert scoreChange={ 10 } isVisible={ false } /> );
	rerender( <ScoreAlert scoreChange={ 10 } isVisible /> );
	expect( screen.getByText( 'Your site got faster' ) ).not.toBeVisible();
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 1 );
	expect( dismissAlert ).not.toHaveBeenCalled();
} );

test.each( [ 'Read the guide', 'Do not show me again' ] )(
	'%s preserves dismissal and CTA tracking',
	label => {
		render( <ScoreAlert scoreChange={ -10 } isVisible /> );
		fireEvent.click( screen.getByText( label ) );
		expect( useDismissibleAlertState ).toHaveBeenCalledWith( 'score_decrease' );
		expect( dismissAlert ).toHaveBeenCalledTimes( 1 );
		expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'speed_score_alert_cta_clicked', {
			score_direction: 'down',
		} );
	}
);
