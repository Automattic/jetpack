import restApi from '@automattic/jetpack-api';
import { Page } from '@wordpress/admin-ui';
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
	showHeader = true,
	showFooter = true,
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
	unwrapped = false,
} ) => {
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	// `jp-admin-page` is a stable, non-hashed hook for global stylesheets and
	// shared SCSS mixins (notably `jetpack-admin-page-layout` in
	// @automattic/jetpack-base-styles). Do not rename.
	const rootClassName = clsx( styles[ 'admin-page' ], 'jp-admin-page', className, {
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

	// When title or breadcrumbs are provided, use admin-ui Page for the full page layout.
	if ( showHeader && ( title || breadcrumbs ) ) {
		return (
			<div className={ rootClassName }>
				<Page
					className="jp-admin-page__page"
					visual={ logo || <JetpackLogo showText={ false } height={ 20 } /> }
					breadcrumbs={ breadcrumbs }
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
					showSidebarToggle={ false }
				>
					{ tabs }
					{ unwrapped ? (
						children
					) : (
						<Container fluid horizontalSpacing={ 0 }>
							<Col>{ children }</Col>
						</Container>
					) }
					{ showFooter && <JetpackFooter menu={ optionalMenuItems } /> }
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
			{ showFooter && <JetpackFooter menu={ optionalMenuItems } /> }
		</div>
	);
};

export default AdminPage;
