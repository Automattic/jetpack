import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { CheckboxControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import { Button, EmptyState, Text } from '@wordpress/ui';
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
			subTitle={ __( 'Subscriber management has a new home.', 'jetpack-newsletter' ) }
			unwrapped
		>
			<div className="jetpack-subscribers-announcement">
				<EmptyState.Root>
					<EmptyState.Visual>
						<EmptyState.Icon icon={ people } />
					</EmptyState.Visual>
					<EmptyState.Title>{ __( 'Subscribers moved', 'jetpack-newsletter' ) }</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'Now it’s part of Jetpack → Newsletter, where you can manage your subscribers and newsletter settings together.',
							'jetpack-newsletter'
						) }
					</EmptyState.Description>
					<EmptyState.Actions>
						<Button onClick={ goToNewsletter }>
							{ __( 'Take me to Newsletter', 'jetpack-newsletter' ) }
						</Button>
					</EmptyState.Actions>
				</EmptyState.Root>
				<div className="jetpack-subscribers-announcement__remove">
					<CheckboxControl
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
						<Text variant="body-sm" className="jetpack-subscribers-announcement__remove-feedback">
							{ __(
								'Subscribers has been removed from the sidebar. You can undo this by unchecking the box.',
								'jetpack-newsletter'
							) }
						</Text>
					) }
				</div>
			</div>
		</AdminPage>
	);
};

export { Stage as stage };
