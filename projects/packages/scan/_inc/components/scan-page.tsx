import { Page } from '@wordpress/admin-ui';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { useHeaderActions } from '../../src/js/header-actions-context';
import './scan-page.scss';
import type { ReactNode } from 'react';

export type ScanTab = 'active' | 'history';

type Props = {
	activeTab: ScanTab;
	children: ReactNode;
};

const PRODUCT_NAME = 'Scan'; /** "Scan" is a product name, do not translate. */

const SUBTITLE = (): string =>
	__( 'Find and fix vulnerabilities and suspicious files on your site.', 'jetpack-scan-page' );

/**
 * Shared chrome for the Scan page — owns the `Page` from
 * `@wordpress/admin-ui` plus the Active threats / History tab nav.
 * `Tabs.Root` lives here so the active-tab indicator slides between
 * tabs instead of remounting on each route hop. A `ResizeObserver`
 * exposes the page-header height as `--jetpack-scan-page-header-height`
 * for the sticky tab row to anchor against.
 *
 * @param props           - Component props.
 * @param props.activeTab - Which tab the current route represents.
 * @param props.children  - Tab panel content (Tabs.Panel siblings).
 * @return The Scan page shell.
 */
export default function ScanPage( { activeTab, children }: Props ): JSX.Element {
	const navigate = useNavigate();
	const headerActions = useHeaderActions();

	useEffect( () => {
		const header = document.querySelector< HTMLElement >( '.admin-ui-page__header' );
		const target = document.querySelector< HTMLElement >( '.admin-ui-page' );
		if ( ! header || ! target ) {
			return;
		}
		const stage = document.querySelector< HTMLElement >( '.boot-layout__stage' );
		const sync = () => {
			target.style.setProperty(
				'--jetpack-scan-page-header-height',
				`${ Math.ceil( header.getBoundingClientRect().height ) }px`
			);
		};
		sync();
		const ro = new ResizeObserver( sync );
		ro.observe( header );
		stage?.addEventListener( 'scroll', sync, { passive: true } );
		window.addEventListener( 'resize', sync );
		return () => {
			ro.disconnect();
			stage?.removeEventListener( 'scroll', sync );
			window.removeEventListener( 'resize', sync );
		};
	}, [] );

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'active' && next !== 'history' ) {
				return;
			}
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					tab: next === 'history' ? 'history' : undefined,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	return (
		<Page
			title={ PRODUCT_NAME }
			ariaLabel={ PRODUCT_NAME }
			subTitle={ SUBTITLE() }
			actions={ headerActions }
			hasPadding={ false }
		>
			<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
				<div className="jetpack-scan-page__tabs-row">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="active">{ __( 'Active threats', 'jetpack-scan-page' ) }</Tabs.Tab>
						<Tabs.Tab value="history">{ __( 'History', 'jetpack-scan-page' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				{ children }
			</Tabs.Root>
		</Page>
	);
}
