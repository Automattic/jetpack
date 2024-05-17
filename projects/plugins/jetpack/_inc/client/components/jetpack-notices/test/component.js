import React from 'react';
import { render, screen } from 'test/test-utils';
import { DevVersionNotice } from '../index';
import { PlanConflictWarning } from '../plan-conflict-warning';

describe( 'PlanConflictWarning', () => {
	const location = { pathname: '/plans' };

	const personalPlan = {
		product_slug: 'jetpack_personal',
		product_name: 'Jetpack Personal',
	};

	const professionalPlan = {
		product_slug: 'jetpack_business',
		product_name: 'Jetpack Professional',
	};

	const dailyBackups = {
		product_slug: 'jetpack_backup_daily',
		product_name: 'Jetpack Backup (Daily)',
	};

	const realTimeBackups = {
		product_slug: 'jetpack_backup_realtime',
		product_name: 'Jetpack Backup (Real-time)',
	};

	it( 'should not render when not in correct path', () => {
		const { container } = render( <PlanConflictWarning location={ { pathname: '/test' } } /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there are no purchases', () => {
		const { container } = render(
			<PlanConflictWarning location={ location } activeSitePurchases={ [] } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is one purchase', () => {
		const { container } = render(
			<PlanConflictWarning location={ location } activeSitePurchases={ [ {} ] } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no backup purchase', () => {
		const { container } = render(
			<PlanConflictWarning location={ location } activeSitePurchases={ [ personalPlan ] } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when there is no site plan purchase', () => {
		const { container } = render(
			<PlanConflictWarning location={ location } activeSitePurchases={ [ dailyBackups ] } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render with both real-time backups and a non-professional plan', () => {
		const { container } = render(
			<PlanConflictWarning
				location={ location }
				activeSitePurchases={ [ realTimeBackups, personalPlan ] }
			/>
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render with both real-time monthly backups and a non-professional plan', () => {
		const realTimeBackupsMontly = {
			product_slug: 'jetpack_backups_realtime_monthly',
			...realTimeBackups,
		};
		const { container } = render(
			<PlanConflictWarning
				location={ location }
				activeSitePurchases={ [ realTimeBackupsMontly, personalPlan ] }
			/>
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should show warning with both daily backups and a plan', () => {
		render(
			<PlanConflictWarning
				location={ location }
				activeSitePurchases={ [ dailyBackups, personalPlan ] }
			/>
		);
		expect(
			screen.getByText(
				'Your Jetpack Personal Plan includes daily backups. ' +
					'Looks like you also purchased the Jetpack Backup (Daily) product. ' +
					'Consider removing Jetpack Backup (Daily).'
			)
		).toBeInTheDocument();
	} );

	it( 'should show warning with both real-time backups and a Professional plan', () => {
		render(
			<PlanConflictWarning
				location={ location }
				activeSitePurchases={ [ realTimeBackups, professionalPlan ] }
			/>
		);
		expect(
			screen.getByText(
				'Your Jetpack Professional Plan includes real-time backups. ' +
					'Looks like you also purchased the Jetpack Backup (Real-time) product. ' +
					'Consider removing Jetpack Backup (Real-time).'
			)
		).toBeInTheDocument();
	} );
} );

describe( 'DevVersionNotice', () => {
	it( 'should not render when Jetpack is a dev version and user is a subscriber', () => {
		const { container } = render(
			<DevVersionNotice isDevVersion={ true } userIsSubscriber={ true } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when Jetpack is not a dev version and user is a subscriber', () => {
		const { container } = render(
			<DevVersionNotice isDevVersion={ false } userIsSubscriber={ true } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when Jetpack is not a dev version and user is not a subscriber', () => {
		const { container } = render(
			<DevVersionNotice isDevVersion={ false } userIsSubscriber={ true } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should show notice when Jetpack is a dev version and user is not a subscriber', () => {
		render( <DevVersionNotice isDevVersion={ true } userIsSubscriber={ false } /> );
		expect(
			screen.getByText( 'You are currently running a development version of Jetpack.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Submit Beta feedback' } ) ).toBeInTheDocument();
	} );
} );
