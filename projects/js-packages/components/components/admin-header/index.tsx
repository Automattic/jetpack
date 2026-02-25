import {
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import clsx from 'clsx';
import JetpackLogo from '../jetpack-logo/index.tsx';
import styles from './style.module.scss';
import type { AdminHeaderProps } from './types.ts';
import type { FC } from 'react';

/**
 * Unified admin page header component.
 *
 * Renders a sticky header with logo, product title, optional subtitle,
 * actions, and tabs. Follows the `@wordpress/admin-ui` Page header pattern.
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
	const classes = clsx( styles[ 'admin-header' ], className );
	return (
		<VStack className={ classes } as="header">
			<HStack justify="space-between" spacing={ 2 }>
				<HStack spacing={ 2 } justify="left">
					{ title && (
						<HStack spacing={ 2 } justify="left">
							{ logo || <JetpackLogo showText={ false } height={ 20 } /> }
							<Heading as="h2" level={ 3 } weight={ 500 } truncate>
								{ title }
							</Heading>
						</HStack>
					) }
					{ breadcrumbs }
					{ badges }
				</HStack>
				<HStack
					style={ { width: 'auto', flexShrink: 0 } }
					spacing={ 2 }
					className="admin-ui-page__header-actions"
				>
					{ actions }
				</HStack>
			</HStack>
			{ subTitle && <p className={ styles[ 'admin-header-subtitle' ] }>{ subTitle }</p> }
			{ tabs }
		</VStack>
	);
};

export default AdminHeader;
