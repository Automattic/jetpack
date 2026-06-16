import { WidgetDashboard, type DashboardWidget } from '@automattic/jetpack-widget-dashboard';
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { Page } from '@wordpress/admin-ui';
import { useState, type ComponentType } from 'react';
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
const DASHBOARD_ROW_HEIGHT = 300;
const DASHBOARD_GRID_GAP = 24;
const DASHBOARD_ONE_COLUMN_WIDTH = 381;
const DASHBOARD_TWO_COLUMN_WIDTH = DASHBOARD_ONE_COLUMN_WIDTH * 2 + DASHBOARD_GRID_GAP;
const DASHBOARD_SINGLE_COLUMN_WIDTH = 576;
const DASHBOARD_PAGE_INLINE_PADDING = 48;
const DESKTOP_DASHBOARD_GRID_WIDTH = `${
	DASHBOARD_ONE_COLUMN_WIDTH * 4 + DASHBOARD_GRID_GAP * 3
}px`;
const DESKTOP_DASHBOARD_PAGE_WIDTH = `${
	DASHBOARD_ONE_COLUMN_WIDTH * 4 + DASHBOARD_GRID_GAP * 3 + DASHBOARD_PAGE_INLINE_PADDING
}px`;
const MOBILE_DASHBOARD_PAGE_WIDTH = '370px';
const NARROW_DASHBOARD_PAGE_WIDTH = '640px';
const DASHBOARD_DEFAULT_HEIGHT = `${ DASHBOARD_ROW_HEIGHT * 2 + DASHBOARD_GRID_GAP }px`;
const DASHBOARD_MIN_HEIGHT = `${ DASHBOARD_ROW_HEIGHT }px`;

const averageItemsWidgetType = {
	...widgetDefinition,
	apiVersion: 1,
	renderModule: AVERAGE_ITEMS_RENDER_MODULE,
} as WidgetType;

const resolveAverageItemsWidgetModule: ResolveWidgetModule = async moduleId => {
	if ( moduleId !== AVERAGE_ITEMS_RENDER_MODULE ) {
		throw new Error( `Unknown widget render module: ${ moduleId }` );
	}

	return {
		default: AverageItemsPerOrderRender as ComponentType< WidgetRenderProps< unknown > >,
	};
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

function ResizableDashboardTileStory() {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( () => [
		createAverageItemsWidget(),
	] );

	return (
		<div style={ { width: DESKTOP_DASHBOARD_GRID_WIDTH, maxWidth: '100%' } }>
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
		<div style={ { width: DESKTOP_DASHBOARD_GRID_WIDTH, maxWidth: '100%' } }>
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
	);
}

function DashboardPageStory( {
	width = DESKTOP_DASHBOARD_PAGE_WIDTH,
	initialLayout = [ createAverageItemsWidget() ],
	rowHeight = DASHBOARD_ROW_HEIGHT,
	initialEditMode = false,
}: {
	width?: string;
	initialLayout?: DashboardWidget[];
	rowHeight?: number;
	initialEditMode?: boolean;
} ) {
	const [ layout, setLayout ] = useState< DashboardWidget[] >( () => initialLayout );
	const [ editMode, setEditMode ] = useState( initialEditMode );

	return (
		<div style={ { width, maxWidth: '100%' } }>
			<WidgetDashboard
				layout={ layout }
				onLayoutChange={ setLayout }
				widgetTypes={ [ averageItemsWidgetType ] }
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
	);
}

const widgetCanvasDecorator: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
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
