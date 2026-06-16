import { WidgetDashboard } from '@automattic/jetpack-widget-dashboard';
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ComponentType,
	type CSSProperties,
} from 'react';
import type { DashboardWidget } from '@automattic/jetpack-widget-dashboard';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@automattic/jetpack-widget-primitives';
import type { Meta, StoryObj } from '@storybook/react';

type ErrorMode = 'custom' | 'default' | 'none';

type StoryWidgetAttributes = {
	mode: ErrorMode;
	label: string;
};

type DashboardWidgetErrorDemoProps = {
	mode: ErrorMode;
	showNeighbor: boolean;
};

const DEMO_WIDGET_TYPE: WidgetType< StoryWidgetAttributes > = {
	apiVersion: 1,
	name: 'premium-analytics/error-handling-demo',
	title: 'Error handling demo',
	renderModule: 'storybook/error-handling-demo',
	category: 'dashboard',
};

const dashboardStyle: CSSProperties = {
	maxWidth: '760px',
	minWidth: '320px',
};

const healthyContentStyle: CSSProperties = {
	alignItems: 'center',
	display: 'flex',
	height: '100%',
	padding: '16px',
};

function StoryWidget( { attributes, setError }: WidgetRenderProps< StoryWidgetAttributes > ) {
	const [ retryCount, setRetryCount ] = useState( 0 );
	const mode = attributes?.mode ?? 'none';
	const label = attributes?.label ?? 'Widget content';

	useEffect( () => {
		if ( mode === 'none' ) {
			setError?.( null );
			return;
		}

		if ( mode === 'default' ) {
			setError?.( true );
			return () => setError?.( null );
		}

		setError?.( {
			message: 'Storybook report request failed.',
			action: {
				label: 'Retry',
				onClick: () => setRetryCount( count => count + 1 ),
			},
		} );

		return () => setError?.( null );
	}, [ mode, retryCount, setError ] );

	if ( mode !== 'none' ) {
		return null;
	}

	return <div style={ healthyContentStyle }>{ label }</div>;
}

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: StoryWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

function createLayout( {
	mode,
	showNeighbor,
}: DashboardWidgetErrorDemoProps ): DashboardWidget< StoryWidgetAttributes >[] {
	const layout: DashboardWidget< StoryWidgetAttributes >[] = [
		{
			uuid: 'error-widget',
			type: DEMO_WIDGET_TYPE.name,
			attributes: {
				mode,
				label: 'Primary widget content',
			},
			placement: {
				width: showNeighbor ? 2 : 'full',
				height: 1,
				order: 0,
			},
		},
	];

	if ( showNeighbor ) {
		layout.push( {
			uuid: 'healthy-widget',
			type: DEMO_WIDGET_TYPE.name,
			attributes: {
				mode: 'none',
				label: 'Neighbor widget content',
			},
			placement: {
				width: 2,
				height: 1,
				order: 1,
			},
		} );
	}

	return layout;
}

function DashboardWidgetErrorDemo( props: DashboardWidgetErrorDemoProps ) {
	const { mode, showNeighbor } = props;
	const initialLayout = useMemo(
		() => createLayout( { mode, showNeighbor } ),
		[ mode, showNeighbor ]
	);
	const [ layout, setLayout ] =
		useState< DashboardWidget< StoryWidgetAttributes >[] >( initialLayout );
	const handleLayoutChange = useCallback( ( next: DashboardWidget[] ) => {
		setLayout( next as DashboardWidget< StoryWidgetAttributes >[] );
	}, [] );

	useEffect( () => {
		setLayout( initialLayout );
	}, [ initialLayout ] );

	return (
		<div style={ dashboardStyle }>
			<WidgetDashboard
				layout={ layout }
				onLayoutChange={ handleLayoutChange }
				widgetTypes={ [ DEMO_WIDGET_TYPE ] }
				resolveWidgetModule={ resolveWidgetModule }
				gridSettings={ { model: 'grid', rowHeight: 240 } }
			>
				<WidgetDashboard.Widgets />
			</WidgetDashboard>
		</div>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/DashboardWidgetError',
	component: DashboardWidgetErrorDemo,
	tags: [ 'autodocs' ],
	argTypes: {
		mode: {
			control: 'select',
			options: [ 'custom', 'default', 'none' ],
		},
		showNeighbor: {
			control: 'boolean',
		},
	},
	args: {
		mode: 'custom',
		showNeighbor: true,
	},
} satisfies Meta< typeof DashboardWidgetErrorDemo >;

export default meta;

type Story = StoryObj< typeof meta >;

export const CustomError: Story = {};

export const DefaultError: Story = {
	args: {
		mode: 'default',
	},
};

export const HealthyWidget: Story = {
	args: {
		mode: 'none',
	},
};
