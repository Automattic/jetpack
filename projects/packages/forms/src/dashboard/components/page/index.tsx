/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import Header from './header';
import NavigableRegion from './navigable-region';
import { SidebarToggleFill } from './sidebar-toggle-slot';
import './style.scss';

/**
 * Page component for dashboard layout
 *
 * @param root0                   - Component props
 * @param root0.breadcrumbs       - Breadcrumb navigation
 * @param root0.badges            - Badge elements
 * @param root0.title             - Page title
 * @param root0.subTitle          - Page subtitle
 * @param root0.children          - Page content
 * @param root0.className         - Additional CSS classes
 * @param root0.actions           - Action buttons
 * @param root0.tabs              - Tab navigation
 * @param root0.hasPadding        - Add padding to content
 * @param root0.hasBorder         - Add border to content
 * @param root0.contentWidth      - Content width constraint
 * @param root0.showSidebarToggle - Show sidebar toggle
 * @return Page component
 */
function Page( {
	breadcrumbs,
	badges,
	title,
	subTitle,
	children,
	className,
	actions,
	tabs,
	hasPadding = true,
	hasBorder = false,
	contentWidth = 'default',
	showSidebarToggle = true,
}: {
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	title?: React.ReactNode;
	subTitle?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
	tabs?: React.ReactNode;
	hasPadding?: boolean;
	hasBorder?: boolean;
	contentWidth?: 'default' | 'full' | 'constrained';
	showSidebarToggle?: boolean;
} ) {
	const classes = clsx( 'admin-ui-page', className );

	return (
		<NavigableRegion className={ classes } ariaLabel={ title }>
			{ ( title || breadcrumbs || badges ) && (
				<Header
					breadcrumbs={ breadcrumbs }
					badges={ badges }
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
					tabs={ tabs }
					showSidebarToggle={ showSidebarToggle }
				/>
			) }
			<div
				className={ clsx( 'admin-ui-page__content', {
					'has-padding': hasPadding,
					'has-border': hasBorder,
					'is-constrained': contentWidth === 'constrained',
				} ) }
			>
				{ children }
			</div>
		</NavigableRegion>
	);
}

Page.SidebarToggleFill = SidebarToggleFill;

export default Page;
