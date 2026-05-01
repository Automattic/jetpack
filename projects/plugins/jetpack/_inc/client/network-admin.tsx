import {
	AdminPage,
	ThemeProvider,
	Container,
	Col,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from 'react';
import './network-admin.scss';

type PageType = 'sites' | 'settings';

declare global {
	interface Window {
		JetpackNetworkAdminData?: {
			sitesUrl: string;
			settingsUrl: string;
		};
	}
}

const PAGE_CONFIG: Record< PageType, { title: string; subTitle: string } > = {
	sites: {
		title: __( 'Network sites', 'jetpack' ),
		subTitle: __( 'Manage Jetpack connections across your network.', 'jetpack' ),
	},
	settings: {
		title: __( 'Network settings', 'jetpack' ),
		subTitle: __( 'Configure Jetpack settings for your entire network.', 'jetpack' ),
	},
};

/**
 * Wraps the server-rendered network admin page content with the unified
 * Jetpack AdminPage header and footer.
 *
 * @param {object}   props          - Component props.
 * @param {PageType} props.pageType - The current page type.
 * @return {import('react').ReactNode} The network admin page.
 */
function NetworkAdminApp( { pageType }: { pageType: PageType } ) {
	const config = PAGE_CONFIG[ pageType ];
	const contentRef = useRef< HTMLDivElement >( null );

	useEffect( () => {
		const phpContent = document.getElementById( 'jp-network-admin-content' );
		if ( contentRef.current && phpContent ) {
			phpContent.style.display = '';
			contentRef.current.appendChild( phpContent );
		}
	}, [] );

	return (
		<AdminPage
			title={ config.title }
			subTitle={ config.subTitle }
			optionalMenuItems={ [
				{
					label: __( 'Support', 'jetpack' ),
					href: getRedirectUrl( 'jetpack-support' ),
				},
			] }
		>
			<Container horizontalSpacing={ 5 } horizontalGap={ 0 }>
				<Col>
					<div ref={ contentRef } />
				</Col>
			</Container>
		</AdminPage>
	);
}

const container = document.getElementById( 'jp-network-admin-root' );
if ( container ) {
	const pageType = ( container.dataset.page as PageType ) || 'sites';
	const root = createRoot( container );
	root.render(
		<ThemeProvider targetDom={ document.body }>
			<NetworkAdminApp pageType={ pageType } />
		</ThemeProvider>
	);
}
