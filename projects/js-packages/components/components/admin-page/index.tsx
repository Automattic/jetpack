import restApi from '@automattic/jetpack-api';
import { Page } from '@wordpress/admin-ui';
import '@wordpress/admin-ui/build-style/style.css';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useEffect, useCallback } from 'react';
import JetpackFooter from '../jetpack-footer/index.tsx';
import JetpackLogo from '../jetpack-logo/index.tsx';
import Col from '../layout/col/index.tsx';
import Container from '../layout/container/index.tsx';
import styles from './style.module.scss';
import type { AdminPageProps } from './types.ts';
import type { FC, ReactNode } from 'react';

/**
 * This is the base structure for any admin page. It comes with Header and Footer.
 *
 * All content must be passed as children wrapped in as many <AdminSection> elements as needed.
 *
 * @param {AdminPageProps} props - Component properties.
 * @return {ReactNode} AdminPage component.
 */
const AdminPage: FC< AdminPageProps > = ( {
	children,
	className,
	moduleName = 'Jetpack' /** "Jetpack" is a product name, do not translate. */,
	moduleNameHref,
	showHeader = true,
	showFooter = true,
	useInternalLinks = false,
	showBackground = true,
	sandboxedDomain = '',
	apiRoot = '',
	apiNonce = '',
	optionalMenuItems,
	header,
	title,
	subTitle,
	logo,
	actions,
	breadcrumbs,
	tabs,
	showBottomBorder = true,
} ) => {
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	const rootClassName = clsx( styles[ 'admin-page' ], className, {
		[ styles.background ]: showBackground,
		[ styles[ 'without-bottom-border' ] ]: tabs || ! showBottomBorder,
	} );

	const testConnection = useCallback( async () => {
		try {
			const connectionTest = await restApi.fetchSiteConnectionTest();

			// eslint-disable-next-line no-alert
			window.alert( connectionTest.message );
		} catch ( error ) {
			// eslint-disable-next-line no-alert
			window.alert(
				sprintf(
					/* translators: %s: an error message. */
					__( 'There was an error testing Jetpack. Error: %s', 'jetpack-components' ),
					error.message
				)
			);
		}
	}, [] );

	// Compose the title with logo for the admin-ui Page header.
	// Page's Header wraps this in an <h2> tag, so we just pass the content directly.
	const composedTitle = title ? (
		<HStack spacing={ 2 } justify="left">
			{ logo || <JetpackLogo showText={ false } height={ 20 } /> }
			<span>{ title }</span>
		</HStack>
	) : undefined;

	const footer = showFooter && (
		<Container className={ styles[ 'admin-page-footer' ] } horizontalSpacing={ 5 }>
			<Col>
				<JetpackFooter
					moduleName={ moduleName }
					moduleNameHref={ moduleNameHref }
					menu={ optionalMenuItems }
					useInternalLinks={ useInternalLinks }
				/>
			</Col>
		</Container>
	);

	// When title or breadcrumbs are provided, use admin-ui Page for the full page layout.
	if ( showHeader && ( composedTitle || breadcrumbs ) ) {
		return (
			<div className={ rootClassName }>
				<Page
					ariaLabel={ title }
					breadcrumbs={ breadcrumbs }
					title={ composedTitle }
					subTitle={ subTitle }
					actions={ actions }
					showSidebarToggle={ false }
				>
					{ tabs }
					<Container fluid horizontalSpacing={ 0 }>
						<Col>{ children }</Col>
					</Container>
					{ footer }
				</Page>
			</div>
		);
	}

	// Legacy path: no title provided, render the classic header.
	return (
		<div className={ rootClassName }>
			{ showHeader && (
				<Container horizontalSpacing={ 5 }>
					<Col className={ clsx( styles[ 'admin-page-header' ], 'jp-admin-page-header' ) }>
						{ header ? header : <JetpackLogo /> }
						{ sandboxedDomain && (
							<code
								className={ styles[ 'sandbox-domain-badge' ] }
								onClick={ testConnection }
								onKeyDown={ testConnection }
								// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
								role="button"
								tabIndex={ 0 }
								title={ `Sandboxing via ${ sandboxedDomain }. Click to test connection.` }
							>
								API Sandboxed
							</code>
						) }
					</Col>
				</Container>
			) }
			<Container fluid horizontalSpacing={ 0 }>
				<Col>{ children }</Col>
			</Container>
			{ footer }
		</div>
	);
};

export default AdminPage;
