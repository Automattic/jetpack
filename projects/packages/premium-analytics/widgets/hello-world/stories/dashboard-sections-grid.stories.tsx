import { useState } from '@wordpress/element';
import { Page } from '@wordpress/admin-ui';
import { Tabs } from '@jetpack-premium-analytics/externals';
import { WidgetDashboard, type DashboardWidget } from '@wordpress/widget-dashboard';
import { DashboardSections } from '../../../routes/dashboard/components';
import styles from '../../../routes/dashboard/stage.module.scss';
import type { Meta, StoryObj } from '@storybook/react';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';

type StoryWidgetAttributes = {
	title: string;
};

type StoryWidgetProps = WidgetRenderProps< StoryWidgetAttributes >;

const widgetTypes: WidgetType< StoryWidgetAttributes >[] = [
	{
		apiVersion: 1,
		name: 'jpa/story-widget',
		title: 'Story widget',
		renderModule: 'jpa/story-widget',
	},
];

const initialLayout: DashboardWidget[] = [
	{
		uuid: 'traffic-overview',
		type: 'jpa/story-widget',
		attributes: { title: 'Traffic overview' },
		placement: {
			width: 2,
			height: 1,
			order: 0,
		},
	},
	{
		uuid: 'visitor-insights',
		type: 'jpa/story-widget',
		attributes: { title: 'Visitor insights' },
		placement: {
			width: 2,
			height: 1,
			order: 1,
		},
	},
	{
		uuid: 'customizable-widget-grid',
		type: 'jpa/story-widget',
		attributes: { title: 'Customizable widget grid' },
		placement: {
			width: 'full',
			height: 1,
			order: 2,
		},
	},
];

/**
 * Story-only widget renderer.
 *
 * @param {StoryWidgetProps} props - Widget render props.
 * @return Rendered story widget.
 */
function StoryWidget( { attributes }: StoryWidgetProps ) {
	return (
		<div
			style={ {
				alignItems: 'center',
				background: '#f6f7f7',
				blockSize: '100%',
				color: '#1e1e1e',
				display: 'flex',
				fontSize: '24px',
				fontWeight: 600,
				justifyContent: 'center',
				minBlockSize: '180px',
				padding: '24px',
				textAlign: 'center',
			} }
		>
			{ attributes.title }
		</div>
	);
}

const resolveWidgetModule: ResolveWidgetModule = moduleId =>
	moduleId === 'jpa/story-widget'
		? Promise.resolve( { default: StoryWidget } )
		: Promise.reject( new Error( `Unknown story widget module: ${ moduleId }` ) );

// In product the section list is server-driven (the dashboardSection entity);
// the story pins a static list mirroring that response shape.
const storySections = [
	{
		id: 'analytics/traffic',
		slug: 'traffic',
		label: 'Traffic',
		description: 'Views, visitors, and where they came from.',
		order: 10,
		default_layout: [],
	},
	{
		id: 'analytics/insights',
		slug: 'insights',
		label: 'Insights',
		description: 'Longer-term patterns in your content and audience.',
		order: 20,
		default_layout: [],
	},
	{
		id: 'analytics/subscribers',
		slug: 'subscribers',
		label: 'Subscribers',
		description: 'How your subscriber list is growing, and how your emails land.',
		order: 30,
		default_layout: [],
	},
	{
		id: 'woocommerce/store',
		slug: 'store',
		label: 'Store',
		description: 'Sales, orders, and what your customers are buying.',
		order: 40,
		default_layout: [],
	},
];

/**
 * Story showing the dashboard section panel scroll surface around a widget grid.
 *
 * @return Story component.
 */
function DashboardSectionsGridStory() {
	const sections = storySections;
	const [ activeSection, setActiveSection ] = useState( sections[ 0 ].slug );
	const [ layout, setLayout ] = useState< DashboardWidget[] >( initialLayout );

	const activeSectionRecord = sections.find( section => section.slug === activeSection );

	return (
		// The page title comes from the breadcrumbs in product; the story passes it
		// directly so it needs no router.
		<Page
			title="Stats"
			subTitle={ activeSectionRecord?.description }
			className={ styles.dashboard }
		>
			<DashboardSections
				sections={ sections }
				value={ activeSection }
				onChange={ setActiveSection }
			>
				{ sections.map( section => (
					<Tabs.Panel key={ section.slug } value={ section.slug } className={ styles.content }>
						{ activeSection === section.slug ? (
							<WidgetDashboard
								widgetTypes={ widgetTypes }
								layout={ layout }
								onLayoutChange={ setLayout }
								resolveWidgetModule={ resolveWidgetModule }
								editMode
							>
								<WidgetDashboard.NoWidgetsState />
								<WidgetDashboard.Widgets className={ styles.widgets } />
							</WidgetDashboard>
						) : null }
					</Tabs.Panel>
				) ) }
			</DashboardSections>
		</Page>
	);
}

const meta: Meta< typeof DashboardSectionsGridStory > = {
	title: 'Packages/Premium Analytics/Routes/Dashboard/SectionsGrid',
	component: DashboardSectionsGridStory,
	decorators: [
		Story => (
			<div
				style={ {
					blockSize: '720px',
					display: 'flex',
					flexDirection: 'column',
					inlineSize: '100%',
				} }
			>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;

type Story = StoryObj< typeof DashboardSectionsGridStory >;

export const Default: Story = {};
