/* eslint-disable import/no-extraneous-dependencies, jest/prefer-spy-on */
import { render, screen } from '@testing-library/react';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useActiveSection, useDashboardGridSettings, useDashboardSections } from './hooks';
import { stage as DashboardStage } from './stage';
import type { DashboardSection } from './config';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	GlobalErrorProvider: ( { children }: { children?: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useReportDateFilters: jest.fn( () => ( {} ) ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: jest.fn( () => <div data-testid="date-filters" /> ),
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( {
		title,
		subTitle,
		actions,
		children,
	}: {
		title: string;
		subTitle?: string;
		actions?: ReactNode;
		children?: ReactNode;
	} ) => (
		<main>
			<h1>{ title }</h1>
			{ subTitle ? <p>{ subTitle }</p> : null }
			{ actions }
			{ children }
		</main>
	),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn( () => [] ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Tabs: {
		Panel: ( { children }: { children?: ReactNode } ) => <div>{ children }</div>,
	},
} ) );

jest.mock( '@wordpress/widget-dashboard', () => {
	type MockWidgetDashboardComponent = jest.Mock< JSX.Element, [ { children?: ReactNode } ] > & {
		Actions: jest.Mock;
		Commands: jest.Mock;
		NoWidgetsState: jest.Mock;
		Widgets: jest.Mock;
	};

	const MockWidgetDashboard = jest.fn( ( { children }: { children?: ReactNode } ) => (
		<div data-testid="widget-dashboard">{ children }</div>
	) ) as MockWidgetDashboardComponent;
	MockWidgetDashboard.Actions = jest.fn( () => <div data-testid="dashboard-actions" /> );
	MockWidgetDashboard.Commands = jest.fn( () => <div data-testid="dashboard-commands" /> );
	MockWidgetDashboard.NoWidgetsState = jest.fn( () => <div data-testid="no-widgets-state" /> );
	MockWidgetDashboard.Widgets = jest.fn( () => <div data-testid="dashboard-widgets" /> );

	return { WidgetDashboard: MockWidgetDashboard };
} );

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetTypes: jest.fn( () => [ [], false ] ),
} ) );

jest.mock( './components', () => ( {
	DashboardSections: ( { children }: { children?: ReactNode } ) => (
		<div data-testid="dashboard-sections">{ children }</div>
	),
} ) );

jest.mock( './hooks', () => ( {
	DASHBOARD_NAME: 'jetpack-premium-analytics_dashboard',
	useActiveSection: jest.fn(),
	useDashboardGridSettings: jest.fn(),
	useDashboardSections: jest.fn(),
} ) );

const trafficSection: DashboardSection = {
	id: 'analytics/traffic',
	label: 'Traffic',
	order: 10,
	layout: [
		{
			uuid: 'traffic-widget',
			type: 'jpa/traffic-chart',
		},
	],
	hasCustomLayout: false,
};

const mockUseDashboardSections = useDashboardSections as jest.MockedFunction<
	typeof useDashboardSections
>;
const mockUseActiveSection = useActiveSection as jest.MockedFunction< typeof useActiveSection >;
const mockUseDashboardGridSettings = useDashboardGridSettings as jest.MockedFunction<
	typeof useDashboardGridSettings
>;
const mockWidgetDashboard = WidgetDashboard as unknown as jest.Mock;

beforeEach( () => {
	mockWidgetDashboard.mockClear();
	mockUseDashboardSections.mockReturnValue( {
		sections: [ trafficSection ],
		isResolvingSections: false,
		updateSectionLayout: jest.fn(),
		resetSectionLayout: jest.fn(),
	} );
	mockUseActiveSection.mockReturnValue( [ trafficSection.id, jest.fn() ] );
	mockUseDashboardGridSettings.mockReturnValue( [ {}, jest.fn(), jest.fn() ] );
} );

describe( 'Dashboard stage', () => {
	it( 'does not mount WidgetDashboard while sections are resolving', () => {
		mockUseDashboardSections.mockReturnValue( {
			sections: [],
			isResolvingSections: true,
			updateSectionLayout: jest.fn(),
			resetSectionLayout: jest.fn(),
		} );
		mockUseActiveSection.mockReturnValue( [ undefined, jest.fn() ] );

		render( <DashboardStage /> );

		expect( screen.getByRole( 'heading', { name: 'Analytics' } ) ).toBeInTheDocument();
		expect( mockWidgetDashboard ).not.toHaveBeenCalled();
	} );

	it( 'mounts WidgetDashboard with editMode off after sections resolve', () => {
		render( <DashboardStage /> );

		const widgetDashboardProps = mockWidgetDashboard.mock.lastCall?.[ 0 ];

		expect( widgetDashboardProps ).toEqual(
			expect.objectContaining( {
				layout: trafficSection.layout,
				editMode: false,
			} )
		);
		expect( screen.getByTestId( 'dashboard-sections' ) ).toBeInTheDocument();
	} );
} );
