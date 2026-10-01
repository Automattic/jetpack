/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import {
	fasterMessage,
	VanillaPopOut,
} from '../../app/assets/src/js/features/speed-score/pop-out/pop-out';
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

test( 'records one impression per loaded score result when the retained Overview becomes visible', () => {
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
	fireEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
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

test.each< number | false >( [ false, 0, 5, -5 ] )(
	'does not show the prompt for a score change of %s',
	scoreChange => {
		render( <ScoreAlert scoreChange={ scoreChange } isVisible /> );
		expect(
			screen.queryByRole( 'heading', { name: 'Your site got faster' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Speed score has fallen' } )
		).not.toBeInTheDocument();
		expect( recordBoostEvent ).not.toHaveBeenCalled();
	}
);

test( 'rating opens the same destination in a new tab and permanently dismisses the prompt', () => {
	render( <ScoreAlert scoreChange={ 6 } isVisible /> );
	const rating = screen.getByRole( 'link', { name: /Rate the Plugin/ } );
	expect( rating ).toHaveAttribute( 'href', fasterMessage.ctaLink );
	expect( rating ).toHaveAttribute( 'target', '_blank' );
	fireEvent.click( rating );
	expect( useDismissibleAlertState ).toHaveBeenCalledWith( 'score_increase' );
	expect( dismissAlert ).toHaveBeenCalledTimes( 1 );
	expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'speed_score_alert_cta_clicked', {
		score_direction: 'up',
	} );
} );

test( 'permanently dismissed prompts remain hidden and do not record impressions', () => {
	jest.mocked( useDismissibleAlertState ).mockReturnValue( [ true, dismissAlert ] );
	render( <ScoreAlert scoreChange={ 10 } isVisible /> );
	expect( screen.queryByRole( 'link', { name: /Rate the Plugin/ } ) ).not.toBeInTheDocument();
	expect( recordBoostEvent ).not.toHaveBeenCalled();
} );

test( 'the default presentation retains the legacy close link and action callbacks', () => {
	const close = jest.fn();
	render(
		<VanillaPopOut
			message={ fasterMessage }
			onClose={ close }
			onDismiss={ dismissAlert }
			isVisible
		/>
	);
	fireEvent.click( screen.getByRole( 'link', { name: 'Dismiss' } ) );
	expect( close ).toHaveBeenCalledTimes( 1 );
	expect( dismissAlert ).not.toHaveBeenCalled();
	const rating = screen.getByRole( 'link', { name: /Rate the Plugin/ } );
	expect( rating ).toHaveAttribute( 'href', fasterMessage.ctaLink );
	expect( rating ).toHaveAttribute( 'target', '_blank' );
	fireEvent.click( rating );
	fireEvent.click( screen.getByRole( 'button', { name: 'Do not show me again' } ) );
	expect( dismissAlert ).toHaveBeenCalledTimes( 2 );
} );
