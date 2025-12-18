/**
 * External dependencies
 */
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading,
} from '@wordpress/components';
import clsx from 'clsx';
import { SidebarToggleSlot } from './sidebar-toggle-slot';
import { Stack } from './stack';

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */

/**
 * Page header component
 *
 * @param root0                   - Component props
 * @param root0.breadcrumbs       - Breadcrumb navigation
 * @param root0.badges            - Badge elements
 * @param root0.title             - Page title
 * @param root0.subTitle          - Page subtitle
 * @param root0.actions           - Action buttons
 * @param root0.tabs              - Tab navigation
 * @param root0.showSidebarToggle - Show sidebar toggle
 * @return Header component
 */
export default function Header( {
	breadcrumbs,
	badges,
	title,
	subTitle,
	actions,
	tabs,
	showSidebarToggle = true,
}: {
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	title?: React.ReactNode;
	subTitle: React.ReactNode;
	actions?: React.ReactNode;
	tabs?: React.ReactNode;
	showSidebarToggle?: boolean;
} ) {
	return (
		<Stack
			direction="column"
			className={ clsx( 'admin-ui-page__header', {
				'has-tabs': tabs,
			} ) }
			render={ <header /> }
		>
			<Stack
				direction="row"
				className="admin-ui-page__header-title"
				justify="space-between"
				gap={ 2 }
				align="center"
			>
				<Stack direction="row" gap={ 2 } wrap="wrap" align="center">
					{ showSidebarToggle && (
						<SidebarToggleSlot bubblesVirtually className="admin-ui-page__sidebar-toggle-slot" />
					) }
					{ title && (
						<Heading level={ 1 } size="15px" lineHeight="32px" truncate>
							{ title }
						</Heading>
					) }
					{ breadcrumbs }
					{ badges }
				</Stack>
				<Stack
					direction="row"
					gap={ 2 }
					style={ { width: 'auto', flexShrink: 0 } }
					className="admin-ui-page__header-actions"
				>
					{ actions }
				</Stack>
			</Stack>
			{ subTitle && <p className="admin-ui-page__header-subtitle">{ subTitle }</p> }
			{ tabs }
		</Stack>
	);
}
