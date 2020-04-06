/**
 * External dependencies
 */
import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { PlanConflictWarning } from '../plan-conflict-warning';

describe( 'PlanConflictWarning', () => {
	const router = { location: { pathname: '/plans' } };

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
		const wrapper = shallow( <PlanConflictWarning router={ { location: { pathname: '/test' } } } /> );
		expect( wrapper.isEmptyRender() ).to.equal( true );
	} );

	it( 'should not render when there are no purchases', () => {
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [] } /> );
		expect( wrapper.isEmptyRender() ).to.equal( true );
	} );

	it( 'should not render when there is one purchase', () => {
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [ {} ] } /> );
		expect( wrapper.isEmptyRender() ).to.equal( true );
	} );

	it( 'should not render when there is no backup purchase', () => {
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [ personalPlan ] } /> );
		expect( wrapper.isEmptyRender() ).to.equal( true );
	} );

	it( 'should not render when there is no site plan purchase', () => {
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [ dailyBackups ] } /> );
		expect( wrapper.isEmptyRender() ).to.equal( true );
	} );

	it( 'should not render with both real-time backups and a non-professional plan', () => {
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [ realTimeBackups, personalPlan ] } /> );
		expect( wrapper.isEmptyRender() ).to.equal( true );
	} );

	it( 'should not render with both real-time monthly backups and a non-professional plan', () => {
		const realTimeBackupsMontly = { product_slug: 'jetpack_backups_realtime_monthly', ...realTimeBackups };
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [ realTimeBackupsMontly, personalPlan ] } /> );
		expect( wrapper.isEmptyRender() ).to.equal( true );
	} );

	it( 'should show warning with both daily backups and a plan', () => {
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [ dailyBackups, personalPlan ] } /> );
		expect( wrapper.prop( 'text' ) ).to.equal(
			'Your Jetpack Personal Plan includes daily backups. ' +
			'Looks like you also purchased the Jetpack Backup (Daily) product. ' +
			'Consider removing Jetpack Backup (Daily).'
		);
	} );

	it( 'should show warning with both real-time backups and a Professional plan', () => {
		const wrapper = shallow( <PlanConflictWarning router={ router } activeSitePurchases={ [ realTimeBackups, professionalPlan ] } /> );
		expect( wrapper.prop( 'text' ) ).to.equal(
			'Your Jetpack Professional Plan includes real-time backups. ' +
			'Looks like you also purchased the Jetpack Backup (Real-time) product. ' +
			'Consider removing Jetpack Backup (Real-time).'
		);
	} );
} );
