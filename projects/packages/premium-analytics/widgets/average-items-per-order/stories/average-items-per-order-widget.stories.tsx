import { WidgetDashboard, type DashboardWidget } from '@automattic/jetpack-widget-dashboard';
import {
	getDefaultQueryParams,
	globalErrorManager,
	queryClient,
} from '@jetpack-premium-analytics/data';
import { Page } from '@wordpress/admin-ui';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AverageItemsPerOrderRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@automattic/jetpack-widget-primitives';

registerReportMocks();

const meta: Meta< typeof AverageItemsPerOrderRender > = {
	title: 'Packages/Premium Analytics/Widgets/AverageItemsPerOrder',
	component: AverageItemsPerOrderRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays the average number of items per order with an optional comparison period and sparkline.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof AverageItemsPerOrderRender >;

const AVERAGE_ITEMS_RENDER_MODULE = 'storybook/average-items-per-order';
const AVERAGE_ITEMS_ERROR_RENDER_MODULE = 'storybook/average-items-per-order-error';
const DASHBOARD_ROW_HEIGHT = 300;
const DASHBOARD_GRID_GAP = 24;
const DASHBOARD_ONE_COLUMN_WIDTH = 256;
const DASHBOARD_TWO_COLUMN_WIDTH = 448;
const DASHBOARD_SINGLE_COLUMN_WIDTH = 576;
const DESKTOP_DASHBOARD_WIDTH = `${ DASHBOARD_ONE_COLUMN_WIDTH * 4 + DASHBOARD_GRID_GAP * 3 }px`;
const MOBILE_DASHBOARD_PAGE_WIDTH = '370px';
const NARROW_DASHBOARD_PAGE_WIDTH = '640px';
const DASHBOARD_DEFAULT_HEIGHT = `${ DASHBOARD_ROW_HEIGHT * 2 + DASHBOARD_GRID_GAP }px`;
const DASHBOARD_MIN_HEIGHT = `${ DASHBOARD_ROW_HEIGHT }px`;

type ReportMockErrorConfig = {
	enabled?: boolean;
	message?: string;
	status?: number;
	paths?: string[];
};

const DISABLED_REPORT_MOCK_ERROR_CONFIG: ReportMockErrorConfig = { enabled: false };

declare global {
	interface Window {
		__STORYBOOK_REPORT_MOCK_ERROR__?: ReportMockErrorConfig;
	}
}

let appliedReportMockErrorConfigKey: string | null = null;

const averageItemsWidgetType = {
	...widgetDefinition,
	apiVersion: 1,
	renderModule: AVERAGE_ITEMS_RENDER_MODULE,
} as WidgetType;

const averageItemsErrorWidgetType = {
	...averageItemsWidgetType,
	renderModule: AVERAGE_ITEMS_ERROR_RENDER_MODULE,
} as WidgetType;

const resolveAverageItemsWidgetModule: ResolveWidgetModule = async moduleId => {
	if ( moduleId === AVERAGE_ITEMS_RENDER_MODULE ) {
		return {
			default: AverageItemsPerOrderRender as ComponentType< WidgetRenderProps< unknown > >,
		};
	}

	if ( moduleId === AVERAGE_ITEMS_ERROR_RENDER_MODULE ) {
		return {
			default: AverageItemsErrorRender as ComponentType< WidgetRenderProps< unknown > >,
		};
	}

	throw new Error( `Unknown widget render module: ${ moduleId }` );
};

const createAverageItemsWidget = (
	placement: DashboardWidget[ 'placement' ] = {
		width: 1,
		height: 2,
		order: 0,
	}
): DashboardWidget => ( {
	uuid: 'average-items-per-order-story',
	type: averageItemsWidgetType.name,
	attributes: {
		reportParams: getDefaultQueryParams( true ),
	},
	placement,
} );

function getReportMockErrorConfigKey( config: ReportMockErrorConfig ): string {
	return JSON.stringify( {
		enabled: Boolean( config.enabled ),
		message: config.message,
		status: config.status,
		paths: config.paths ?? [],
	} );
}

function applyReportMockErrorConfig( config: ReportMockErrorConfig ) {
	if ( typeof window === 'undefined' ) {
		return;
	}

	const configKey = getReportMockErrorConfigKey( config );

	if ( appliedReportMockErrorConfigKey === configKey ) {
		return;
	}

	window.__STORYBOOK_REPORT_MOCK_ERROR__ = config.enabled ? config : undefined;
	queryClient.clear();
	globalErrorManager.clearError();
	appliedReportMockErrorConfigKey = configKey;
}

function ReportMockErrorScope( {
	children,
	config,
}: {
	children: ReactNode;
	config: ReportMockErrorConfig;
} ) {
	applyReportMockErrorConfig( config );
	return children;
}

function AverageItemsErrorRender( { setError }: WidgetRenderProps< unknown > ) {
	useEffect( () => {
		setError?.( {
			message: "We couldn't load this data. Please try again in a moment.",
			action: {
				label: 'Retry',
				onClick: () => setError?.( null ),
			},
		} );

		return () => setError?.( null );
	}, [ setError ] );

	return null;
}

function ResizableDashboardTileStory() {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( () => [
		createAverageItemsWidget(),
	] );

	return (
		<ReportMockErrorScope config={ DISABLED_REPORT_MOCK_ERROR_CONFIG }>
			<div style={ { width: DESKTOP_DASHBOARD_WIDTH, maxWidth: '100%' } }>
				<WidgetDashboard
					layout={ layout }
					onLayoutChange={ setLayout }
					widgetTypes={ [ averageItemsWidgetType ] }
					resolveWidgetModule={ resolveAverageItemsWidgetModule }
					editMode={ true }
					gridSettings={ { model: 'grid', rowHeight: DASHBOARD_ROW_HEIGHT } }
				>
					<WidgetDashboard.Widgets />
				</WidgetDashboard>
			</div>
		</ReportMockErrorScope>
	);
}

function MinimumDashboardTileStory() {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( () => [
		createAverageItemsWidget( {
			width: 1,
			height: 1,
			order: 0,
		} ),
	] );

	return (
		<ReportMockErrorScope config={ DISABLED_REPORT_MOCK_ERROR_CONFIG }>
			<div style={ { width: DESKTOP_DASHBOARD_WIDTH, maxWidth: '100%' } }>
				<WidgetDashboard
					layout={ layout }
					onLayoutChange={ setLayout }
					widgetTypes={ [ averageItemsWidgetType ] }
					resolveWidgetModule={ resolveAverageItemsWidgetModule }
					editMode={ true }
					gridSettings={ { model: 'grid', rowHeight: 200 } }
				>
					<WidgetDashboard.Widgets />
				</WidgetDashboard>
			</div>
		</ReportMockErrorScope>
	);
}

function DashboardPageStory( {
	width = DESKTOP_DASHBOARD_WIDTH,
	initialLayout = [ createAverageItemsWidget() ],
	rowHeight = DASHBOARD_ROW_HEIGHT,
	initialEditMode = false,
	widgetTypes = [ averageItemsWidgetType ],
}: {
	width?: string;
	initialLayout?: DashboardWidget[];
	rowHeight?: number;
	initialEditMode?: boolean;
	widgetTypes?: WidgetType[];
} ) {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( () => initialLayout );
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<ReportMockErrorScope config={ DISABLED_REPORT_MOCK_ERROR_CONFIG }>
			<div style={ { width, maxWidth: '100%' } }>
				<WidgetDashboard
					layout={ layout }
					onLayoutChange={ setLayout }
					widgetTypes={ widgetTypes }
					resolveWidgetModule={ resolveAverageItemsWidgetModule }
					gridSettings={ { model: 'grid', rowHeight } }
					editMode={ editMode }
					onEditChange={ setEditMode }
				>
					<Page title="Analytics" actions={ <WidgetDashboard.Actions /> } hasPadding>
						<WidgetDashboard.NoWidgetsState />
						<WidgetDashboard.Widgets />
					</Page>
				</WidgetDashboard>
			</div>
		</ReportMockErrorScope>
	);
}

const widgetCanvasDecorator: Decorator = Story => (
	<ReportMockErrorScope config={ DISABLED_REPORT_MOCK_ERROR_CONFIG }>
		<div style={ { width: '100%', height: '300px' } }>
			<Story />
		</div>
	</ReportMockErrorScope>
);

export const Default: Story = {
	args: {
		attributes: {
			reportParams: getDefaultQueryParams(),
		},
	},
	decorators: [ widgetCanvasDecorator ],
};

export const WithComparison: Story = {
	args: {
		attributes: {
			reportParams: getDefaultQueryParams( true ),
		},
	},
	decorators: [ widgetCanvasDecorator ],
};

const createDashboardSizeDecorator = (
	width: string,
	height = DASHBOARD_DEFAULT_HEIGHT
): Decorator => {
	return Story => (
		<ReportMockErrorScope config={ DISABLED_REPORT_MOCK_ERROR_CONFIG }>
			<div
				style={ {
					width,
					height,
					boxSizing: 'border-box',
					border: '1px dashed #ccc',
					borderRadius: '8px',
					padding: '16px',
					background: '#fafafa',
					containerType: 'inline-size',
					containerName: 'widget',
				} }
			>
				<Story />
			</div>
		</ReportMockErrorScope>
	);
};

export const DesktopOneColumnDefault: Story = {
	args: WithComparison.args,
	decorators: [ createDashboardSizeDecorator( `${ DASHBOARD_ONE_COLUMN_WIDTH }px` ) ],
};

export const TwoColumnDashboardDefault: Story = {
	args: WithComparison.args,
	decorators: [ createDashboardSizeDecorator( `${ DASHBOARD_TWO_COLUMN_WIDTH }px` ) ],
};

export const SingleColumnDashboardDefault: Story = {
	args: WithComparison.args,
	decorators: [ createDashboardSizeDecorator( `${ DASHBOARD_SINGLE_COLUMN_WIDTH }px` ) ],
};

export const MinimumResizedTile: Story = {
	args: WithComparison.args,
	decorators: [
		createDashboardSizeDecorator( `${ DASHBOARD_ONE_COLUMN_WIDTH }px`, DASHBOARD_MIN_HEIGHT ),
	],
};

export const ResizableDashboardTile: Story = {
	render: () => <ResizableDashboardTileStory />,
};

export const MinimumDashboardTile: Story = {
	render: () => <MinimumDashboardTileStory />,
};

export const DashboardPageDefault: Story = {
	render: () => <DashboardPageStory />,
};

export const DashboardPageNarrow: Story = {
	render: () => <DashboardPageStory width={ NARROW_DASHBOARD_PAGE_WIDTH } />,
};

export const DashboardPageNarrowEditMode: Story = {
	render: () => <DashboardPageStory width={ NARROW_DASHBOARD_PAGE_WIDTH } initialEditMode />,
};

export const DashboardPageMobile: Story = {
	render: () => <DashboardPageStory width={ MOBILE_DASHBOARD_PAGE_WIDTH } />,
};

export const DashboardPageMinimumTile: Story = {
	render: () => (
		<DashboardPageStory
			width={ NARROW_DASHBOARD_PAGE_WIDTH }
			initialLayout={ [
				createAverageItemsWidget( {
					width: 1,
					height: 1,
					order: 0,
				} ),
			] }
			rowHeight={ 200 }
		/>
	),
};

export const DashboardPageMobileMinimumTile: Story = {
	render: () => (
		<DashboardPageStory
			width={ MOBILE_DASHBOARD_PAGE_WIDTH }
			initialLayout={ [
				createAverageItemsWidget( {
					width: 1,
					height: 1,
					order: 0,
				} ),
			] }
			rowHeight={ 200 }
		/>
	),
};

export const DashboardPageMinimumTileEditMode: Story = {
	render: () => (
		<DashboardPageStory
			width={ NARROW_DASHBOARD_PAGE_WIDTH }
			initialLayout={ [
				createAverageItemsWidget( {
					width: 1,
					height: 1,
					order: 0,
				} ),
			] }
			rowHeight={ 200 }
			initialEditMode
		/>
	),
};

export const DashboardPageWidgetError: Story = {
	render: () => <DashboardPageStory widgetTypes={ [ averageItemsErrorWidgetType ] } />,
	parameters: {
		docs: {
			description: {
				story:
					'For a widget-specific report failure, the widget reports the error through setError and the dashboard chrome shows the inline notice with a Retry action.',
			},
		},
	},
};

export const DashboardPageWidgetErrorEditMode: Story = {
	render: () => (
		<DashboardPageStory initialEditMode widgetTypes={ [ averageItemsErrorWidgetType ] } />
	),
};
