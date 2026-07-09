import {
	getDefaultSectionId,
	isDashboardSection,
	isDashboardSectionId,
	isDashboardSections,
	replaceDashboardSection,
	resolveSectionId,
	sortDashboardSections,
} from './sections';
import type { DashboardSection } from './sections';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const defaultLayout: DashboardWidget[] = [
	{
		uuid: 'default-traffic-widget',
		type: 'jpa/visitors-over-time',
	},
];

const trafficSection: DashboardSection = {
	id: 'analytics/traffic',
	label: 'Traffic',
	order: 10,
	layout: defaultLayout,
	hasCustomLayout: false,
};

const subscribersSection: DashboardSection = {
	id: 'analytics/subscribers',
	label: 'Subscribers',
	order: 30,
	layout: [],
	hasCustomLayout: true,
};

describe( 'dashboard sections', () => {
	it( 'validates REST-provided dashboard section IDs', () => {
		expect( isDashboardSectionId( 'analytics/traffic' ) ).toBe( true );
		expect( isDashboardSectionId( 'traffic' ) ).toBe( false );
		expect( isDashboardSectionId( 'analytics/traffic/extra' ) ).toBe( false );
	} );

	it( 'validates REST-provided dashboard section records', () => {
		expect( isDashboardSection( trafficSection ) ).toBe( true );
		expect( isDashboardSections( [ trafficSection, subscribersSection ] ) ).toBe( true );
		expect(
			isDashboardSection( {
				...trafficSection,
				layout: {},
			} )
		).toBe( false );
	} );

	it( 'sorts sections by server order with ID tie-breaks', () => {
		expect( sortDashboardSections( [ subscribersSection, trafficSection ] ) ).toEqual( [
			trafficSection,
			subscribersSection,
		] );
	} );

	it( 'resolves search values against available sections', () => {
		const sections = [ trafficSection, subscribersSection ];

		expect( getDefaultSectionId( sections ) ).toBe( 'analytics/traffic' );
		expect( resolveSectionId( 'analytics/subscribers', sections ) ).toBe( 'analytics/subscribers' );
		expect( resolveSectionId( 'analytics/missing', sections ) ).toBe( 'analytics/traffic' );
		expect( resolveSectionId( undefined, sections ) ).toBe( 'analytics/traffic' );
		expect( resolveSectionId( 'analytics/traffic', [] ) ).toBeUndefined();
	} );

	it( 'replaces updated sections and preserves order', () => {
		const updatedTrafficSection: DashboardSection = {
			...trafficSection,
			layout: [],
			hasCustomLayout: true,
		};

		expect(
			replaceDashboardSection( [ subscribersSection, trafficSection ], updatedTrafficSection )
		).toEqual( [ updatedTrafficSection, subscribersSection ] );
	} );
} );
