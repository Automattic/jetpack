import { GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { Page } from '@wordpress/admin-ui';
import { WidgetDashboard, type DashboardWidget } from '@wordpress/widget-dashboard';
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import type { ArgTypes } from '@storybook/react';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';

const DASHBOARD_ROW_HEIGHT = 300;
const DASHBOARD_GRID_GAP = 24;
const DASHBOARD_ONE_COLUMN_WIDTH = 381;
const DASHBOARD_PAGE_INLINE_PADDING = 48;

export const WIDGET_DASHBOARD_STORY_WIDTHS = {
	desktop: `${
		DASHBOARD_ONE_COLUMN_WIDTH * 4 + DASHBOARD_GRID_GAP * 3 + DASHBOARD_PAGE_INLINE_PADDING
	}px`,
	narrow: '640px',
	mobile: '370px',
} as const;

export type WidgetDashboardStoryHostEnvironment = 'wordpress-admin' | 'storybook';

const HOST_ROOT_FONT_SIZE: Record< WidgetDashboardStoryHostEnvironment, string | undefined > = {
	'wordpress-admin': '13px',
	storybook: undefined,
};

export interface WidgetDashboardWithWidgetControls {
	dashboardWidth: string;
	widgetWidth: number;
	widgetHeight: number;
	rowHeight: number;
	editMode: boolean;
	hostEnvironment: WidgetDashboardStoryHostEnvironment;
}

export const DEFAULT_WIDGET_DASHBOARD_STORY_ARGS: WidgetDashboardWithWidgetControls = {
	dashboardWidth: WIDGET_DASHBOARD_STORY_WIDTHS.desktop,
	widgetWidth: 1,
	widgetHeight: 2,
	rowHeight: DASHBOARD_ROW_HEIGHT,
	editMode: false,
	hostEnvironment: 'wordpress-admin',
};

export const widgetDashboardWithWidgetArgTypes = {
	dashboardWidth: {
		control: 'select',
		options: Object.values( WIDGET_DASHBOARD_STORY_WIDTHS ),
	},
	widgetWidth: {
		control: { type: 'number', min: 1, max: 4, step: 1 },
	},
	widgetHeight: {
		control: { type: 'number', min: 1, max: 4, step: 1 },
	},
	rowHeight: {
		control: { type: 'number', min: 200, max: 400, step: 100 },
	},
	editMode: {
		control: 'boolean',
	},
	hostEnvironment: {
		control: 'select',
		options: Object.keys( HOST_ROOT_FONT_SIZE ),
	},
} satisfies Partial< ArgTypes< WidgetDashboardWithWidgetControls > >;

type StoryWidgetMetadata = {
	name: string;
	title: WidgetType[ 'title' ];
} & Partial< Omit< WidgetType, 'apiVersion' | 'name' | 'renderModule' | 'title' > >;

interface WidgetDashboardWithWidgetProps extends WidgetDashboardWithWidgetControls {
	widgetType: StoryWidgetMetadata;
	renderModule: string;
	renderComponent: ComponentType< WidgetRenderProps< unknown > >;
	attributes?: DashboardWidget[ 'attributes' ];
	pageTitle?: string;
	widgetUuid?: string;
}

function HostRootFontSize( {
	children,
	hostEnvironment,
}: {
	children: ReactNode;
	hostEnvironment: WidgetDashboardStoryHostEnvironment;
} ) {
	useEffect( () => {
		const { fontSize } = document.documentElement.style;
		const rootFontSize = HOST_ROOT_FONT_SIZE[ hostEnvironment ];

		if ( rootFontSize ) {
			document.documentElement.style.fontSize = rootFontSize;
		}

		return () => {
			document.documentElement.style.fontSize = fontSize;
		};
	}, [ hostEnvironment ] );

	return children;
}

export function WidgetDashboardWithWidget( {
	widgetType,
	renderModule,
	renderComponent,
	attributes,
	dashboardWidth,
	widgetWidth,
	widgetHeight,
	rowHeight,
	editMode,
	hostEnvironment,
	pageTitle = 'Analytics',
	widgetUuid = `${ widgetType.name }-story`,
}: WidgetDashboardWithWidgetProps ) {
	const storyWidgetType = useMemo< WidgetType >(
		() => ( {
			...widgetType,
			apiVersion: 1,
			name: widgetType.name as WidgetType[ 'name' ],
			renderModule,
		} ),
		[ renderModule, widgetType ]
	);

	const resolveWidgetModule = useMemo< ResolveWidgetModule >(
		() => async moduleId => {
			if ( moduleId !== renderModule ) {
				throw new Error( `Unknown widget render module: ${ moduleId }` );
			}

			return {
				default: renderComponent,
			};
		},
		[ renderComponent, renderModule ]
	);

	const widget = useMemo< DashboardWidget >(
		() => ( {
			uuid: widgetUuid,
			type: storyWidgetType.name,
			attributes,
			placement: {
				width: widgetWidth,
				height: widgetHeight,
				order: 0,
			},
		} ),
		[ attributes, storyWidgetType.name, widgetHeight, widgetUuid, widgetWidth ]
	);

	const [ layout, setLayout ] = useState< DashboardWidget[] >( () => [ widget ] );
	const [ currentEditMode, setCurrentEditMode ] = useState( editMode );

	useEffect( () => {
		setLayout( [ widget ] );
	}, [ widget ] );

	useEffect( () => {
		setCurrentEditMode( editMode );
	}, [ editMode ] );

	return (
		<GlobalErrorProvider>
			<HostRootFontSize hostEnvironment={ hostEnvironment }>
				{ /*
				 * Outer box fills the canvas and owns horizontal overflow; the inner
				 * box holds the simulated `dashboardWidth`. The host widget-settings
				 * drawer is portaled to <body> and positioned `fixed; right: 0`, so a
				 * body wider than the visible canvas (which a fixed `dashboardWidth`
				 * wider than the Storybook preview would cause) pushes the drawer
				 * off-screen. Containing the overflow here keeps the document at canvas
				 * width so the drawer stays anchored to the visible viewport edge; the
				 * wide layout remains inspectable by scrolling the box.
				 *
				 * Both boxes are flex columns with a bounded (viewport) height so the
				 * `Page` inside resolves its `height: 100%` and its content area becomes
				 * the internal scroll surface — matching how the real dashboard fills the
				 * wp-admin viewport. Without a definite height the page collapses to its
				 * content height and the fixed-row-height grid resizes it back on every
				 * vertical widget resize, so the two oscillate and the grid flickers.
				 *
				 * `isolation: isolate` keeps dashboard-internal z-indexes (widget
				 * headers, resize handles) inside this box's stacking context. The
				 * settings drawer has no z-index of its own (`--wp-ui-drawer-z-index`
				 * defaults to `initial`), so without the isolation those `z-index: 1`
				 * elements escalate to the document level and paint over the
				 * body-portaled drawer — in the real dashboard the wp-admin shell
				 * provides this containing stacking context.
				 */ }
				<div
					style={ {
						blockSize: '100vh',
						display: 'flex',
						flexDirection: 'column',
						inlineSize: '100%',
						isolation: 'isolate',
						overflowX: 'auto',
					} }
				>
					<div
						style={ {
							display: 'flex',
							flex: '1 1 auto',
							flexDirection: 'column',
							inlineSize: dashboardWidth,
							minBlockSize: 0,
						} }
					>
						<WidgetDashboard
							layout={ layout }
							onLayoutChange={ setLayout }
							widgetTypes={ [ storyWidgetType ] }
							resolveWidgetModule={ resolveWidgetModule }
							gridSettings={ { model: 'grid', rowHeight } }
							editMode={ currentEditMode }
							onEditChange={ setCurrentEditMode }
						>
							<Page title={ pageTitle } actions={ <WidgetDashboard.Actions /> } hasPadding>
								<WidgetDashboard.NoWidgetsState />
								<WidgetDashboard.Widgets />
							</Page>
						</WidgetDashboard>
					</div>
				</div>
			</HostRootFontSize>
		</GlobalErrorProvider>
	);
}
