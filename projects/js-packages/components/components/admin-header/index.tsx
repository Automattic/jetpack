import { Page } from '@wordpress/admin-ui';
import {
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import JetpackLogo from '../jetpack-logo/index.tsx';
import type { AdminHeaderProps } from './types.ts';
import type { FC } from 'react';

/**
 * Unified admin page header component.
 *
 * Renders a sticky header with logo, product title, optional subtitle,
 * actions, and tabs. Wraps the `@wordpress/admin-ui` Page component.
 *
 * @param {AdminHeaderProps} props - Component properties.
 * @return {ReactNode} AdminHeader component.
 */
const AdminHeader: FC< AdminHeaderProps > = ( {
	logo,
	title,
	subTitle,
	actions,
	tabs = null,
	className,
	breadcrumbs = null,
	badges = null,
} ) => {
	const classes = className;

	// While admin-ui Page has a title prop, it fails to render both the logo and
	// text. Internally it tries to accommodate both inside Heading.
	// Composing here with Heading as it is on admin-ui Page.
	const composedTitle = title ? (
		<HStack spacing={ 2 } justify="left">
			{ logo || <JetpackLogo showText={ false } height={ 20 } /> }
			<Heading as="h2" level={ 3 } weight={ 500 } truncate>
				{ title }
			</Heading>
		</HStack>
	) : undefined;

	return (
		<Page
			className={ classes }
			title={ composedTitle }
			subTitle={ subTitle }
			actions={ actions }
			breadcrumbs={ breadcrumbs }
			badges={ badges }
			showSidebarToggle={ false }
		>
			{ tabs }
		</Page>
	);
};

export default AdminHeader;
