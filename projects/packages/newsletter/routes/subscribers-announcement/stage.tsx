import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './route.scss';
import type { ChangeEvent } from 'react';

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
 * Jetpack Forms "Forms moved" announcement page.
 *
 * @return Stage content.
 */
const Stage = (): JSX.Element => {
	const data = getAnnouncementData();
	const [ menuRemoved, setMenuRemoved ] = useState( Boolean( data?.menuRemoved ) );
	const [ isSaving, setIsSaving ] = useState( false );

	const toggleMenu = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			if ( ! data ) {
				return;
			}

			const removed = event.target.checked;

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
				<div className="jetpack-subscribers-announcement__hero">
					<h1>{ __( 'Subscribers moved', 'jetpack-newsletter' ) }</h1>
					<p className="jetpack-subscribers-announcement__subtitle">
						{ __( 'Now it’s part of Jetpack → Newsletter', 'jetpack-newsletter' ) }
					</p>
					<p>
						<a
							className="jetpack-subscribers-announcement__button"
							href={ data?.goToNewsletterUrl }
						>
							{ __( 'Take me to Newsletter', 'jetpack-newsletter' ) }
						</a>
					</p>
					<div className="jetpack-subscribers-announcement__remove">
						<label htmlFor="jetpack-subscribers-announcement-remove-checkbox">
							<input
								type="checkbox"
								id="jetpack-subscribers-announcement-remove-checkbox"
								checked={ menuRemoved }
								disabled={ isSaving || ! data }
								onChange={ toggleMenu }
							/>{ ' ' }
							{ __( 'Remove Subscribers from the sidebar', 'jetpack-newsletter' ) }
						</label>
						<p className="description">
							{ __(
								'This shortcut will be removed automatically in a future release. You can always manage your subscribers from the Newsletter page.',
								'jetpack-newsletter'
							) }
						</p>
						{ menuRemoved && (
							<p className="jetpack-subscribers-announcement__remove-feedback">
								{ __(
									'Subscribers has been removed from the sidebar. You can undo this by unchecking the box.',
									'jetpack-newsletter'
								) }
							</p>
						) }
					</div>
				</div>
			</div>
		</AdminPage>
	);
};

export { Stage as stage };
