import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { ToggleControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Text } from '@wordpress/ui';
import './route.scss';

/**
 * Server data printed by Subscribers_Announcement::print_app_data() on the
 * announcement page only.
 */
type AnnouncementData = {
	ajaxUrl: string;
	toggleAction: string;
	toggleNonce: string;
	goToNewsletterUrl: string;
	menuRemoved: boolean;
	menuSlug: string;
};

const getAnnouncementData = (): AnnouncementData | undefined =>
	( window as unknown as { JetpackSubscribersAnnouncementData?: AnnouncementData } )
		.JetpackSubscribersAnnouncementData;

/**
 * Transitional "Subscribers moved" announcement page.
 *
 * Replaces the legacy "Subscribers ↗" Calypso shortcut once the Newsletter
 * modernization filter is on, pointing people at the unified
 * Jetpack → Newsletter page and letting them remove the leftover menu item.
 *
 * The Jetpack header and footer come from AdminPage; the body mirrors the
 * Jetpack Forms "Forms moved" announcement page, built from design-system
 * components (`@wordpress/ui` Text/Button/Notice + `@wordpress/components`
 * CheckboxControl).
 *
 * @return Stage content.
 */
const Stage = (): JSX.Element => {
	const data = getAnnouncementData();
	const [ menuRemoved, setMenuRemoved ] = useState( Boolean( data?.menuRemoved ) );
	const [ isSaving, setIsSaving ] = useState( false );

	const goToNewsletter = useCallback( () => {
		if ( data?.goToNewsletterUrl ) {
			window.location.href = data.goToNewsletterUrl;
		}
	}, [ data?.goToNewsletterUrl ] );

	const toggleMenu = useCallback(
		( removed: boolean ) => {
			if ( ! data ) {
				return;
			}

			setIsSaving( true );

			const body = new FormData();
			body.append( 'action', data.toggleAction );
			body.append( '_ajax_nonce', data.toggleNonce );
			body.append( 'removed', removed ? '1' : '0' );

			fetch( data.ajaxUrl, { method: 'POST', credentials: 'same-origin', body } )
				.then( response => response.json() )
				.then( ( response: { success?: boolean } ) => {
					if ( ! response?.success ) {
						throw new Error( 'request failed' );
					}

					setMenuRemoved( removed );

					// Reflect the change in the sidebar right away.
					const menuItem = document
						.querySelector( `#adminmenu a[href$="page=${ data.menuSlug }"]` )
						?.closest( 'li' );
					if ( menuItem ) {
						( menuItem as HTMLElement ).style.display = removed ? 'none' : '';
					} else if ( ! removed ) {
						// The page was opened directly while the menu was already
						// removed, so there's no sidebar item to un-hide. Reload so the
						// server re-registers it now that the option is cleared.
						window.location.reload();
					}
				} )
				.catch( () => {} )
				.finally( () => setIsSaving( false ) );
		},
		[ data ]
	);

	return (
		<AdminPage
			apiRoot={ getSiteData()?.rest_root }
			apiNonce={ getSiteData()?.rest_nonce }
			title={ __( 'Subscribers', 'jetpack-newsletter' ) }
			unwrapped
		>
			<div className="jetpack-subscribers-announcement">
				<div className="jetpack-subscribers-announcement__inner">
					<Text variant="heading-2xl" className="jetpack-subscribers-announcement__heading">
						{ __( 'Subscribers moved', 'jetpack-newsletter' ) }
					</Text>
					<Text variant="body-lg" className="jetpack-subscribers-announcement__subtitle">
						{ __( 'Now it’s part of Jetpack → Newsletter', 'jetpack-newsletter' ) }
					</Text>
					<div className="jetpack-subscribers-announcement__cta">
						<Button onClick={ goToNewsletter }>
							{ __( 'View my subscribers', 'jetpack-newsletter' ) }
						</Button>
					</div>
					<div className="jetpack-subscribers-announcement__remove">
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Remove Subscribers from the sidebar', 'jetpack-newsletter' ) }
							help={ __(
								'This shortcut will be removed automatically in a future release. You can always manage your subscribers from the Newsletter page.',
								'jetpack-newsletter'
							) }
							checked={ menuRemoved }
							disabled={ isSaving || ! data }
							onChange={ toggleMenu }
						/>
						{ menuRemoved && (
							<Notice.Root
								intent="success"
								className="jetpack-subscribers-announcement__remove-feedback"
							>
								<Notice.Description>
									{ __(
										'The Subscribers shortcut has been removed from the sidebar. Uncheck the box to restore it.',
										'jetpack-newsletter'
									) }
								</Notice.Description>
							</Notice.Root>
						) }
					</div>
				</div>
			</div>
		</AdminPage>
	);
};

export { Stage as stage };
