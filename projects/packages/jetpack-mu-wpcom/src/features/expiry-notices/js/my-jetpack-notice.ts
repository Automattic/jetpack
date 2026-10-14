import { addFilter } from '@wordpress/hooks';
import { clickCta, dismissNotice, trackOncePerSession } from './notice.ts';
import type { Cta, TrackProps } from './notice.ts';

interface MyJetpackNoticeData {
	filter: string;
	metaKey: string;
	title: string;
	message: string;
	// Null when the viewer cannot renew, and secondary outside grace.
	primary: Cta | null;
	secondary: Cta | null;
	isDismissible: boolean;
	trackProps: TrackProps;
}

declare global {
	interface Window {
		wpcomExpiryMyJetpackNotice?: MyJetpackNoticeData;
	}
}

const data = window.wpcomExpiryMyJetpackNotice;
if ( data ) {
	const { metaKey, primary, secondary, trackProps } = data;

	const action = ( ctaId: 'primary' | 'secondary', cta: Cta ) => ( {
		label: cta.label,
		variant: ctaId,
		onClick: ( event: Event ) => {
			if (
				! clickCta( event, cta.message, ctaId, 'jetpack_expiry_banner_cta_click', trackProps )
			) {
				window.location.assign( cta.url );
			}
		},
	} );

	addFilter( data.filter, 'wpcom/expiry-notices', ( notices: unknown[] ) => [
		...notices,
		{
			title: data.title,
			message: data.message,
			options: {
				id: 'wpcom-expiry-notice',
				level: 'error',
				// My Jetpack's NOTICE_PRIORITY_MEDIUM, which its own expiry notice used.
				priority: 200,
				actions: [
					...( primary ? [ action( 'primary', primary ) ] : [] ),
					...( secondary ? [ action( 'secondary', secondary ) ] : [] ),
				],
				hideCloseButton: ! data.isDismissible,
				onView: () =>
					trackOncePerSession(
						`${ metaKey }_my_jetpack_impression_fired`,
						'jetpack_expiry_banner_impression',
						trackProps
					),
				// My Jetpack hides the notice; a failed write brings it back on the next load.
				onClose: () =>
					dismissNotice( metaKey, 'jetpack_expiry_banner_dismiss', trackProps, () => {} ),
			},
		},
	] );
}
