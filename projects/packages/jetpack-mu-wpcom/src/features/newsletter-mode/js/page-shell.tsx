import AdminPage from '@automattic/jetpack-components/admin-page';
import { __ } from '@wordpress/i18n';
import './style.scss';
import type { ReactNode } from 'react';

type NewsletterModePageShellProps = {
	children: ReactNode;
};

/**
 * Shared Newsletter Mode page chrome.
 *
 * Route stages provide their own content while this component keeps the page
 * title, footer, and other shared chrome consistent.
 *
 * @param props          - Component props.
 * @param props.children - Route content rendered inside the shell.
 * @return Newsletter Mode page shell.
 */
export function NewsletterModePageShell( { children }: NewsletterModePageShellProps ): JSX.Element {
	return (
		<AdminPage
			title={ __( 'Newsletter', 'jetpack-mu-wpcom' ) }
			subTitle={ __( 'Create, grow, and manage your newsletter.', 'jetpack-mu-wpcom' ) }
		>
			{ children }
		</AdminPage>
	);
}
