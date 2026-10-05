import { clickCta, dismissNotice, trackOncePerSession } from './notice.ts';
import type { TrackProps } from './notice.ts';

declare global {
	interface Window {
		wpcomExpiryBanner?: { metaKey: string; trackProps: TrackProps };
	}
}

const banner = document.querySelector< HTMLElement >( '[data-wpcom-expiry-banner]' );
const data = window.wpcomExpiryBanner;

if ( banner && data ) {
	const { metaKey, trackProps } = data;
	const isFrontend = trackProps.surface === 'frontend';

	if ( isFrontend ) {
		// Footer-rendered on themes without wp_body_open; a theme wrapper must not
		// become the containing block of the small-screen absolute positioning.
		if ( banner.parentElement !== document.body ) {
			document.body.prepend( banner );
		}
		// The copy wraps at narrow widths, so the offset is measured, not fixed.
		const setOffset = () =>
			document.body.style.setProperty(
				'--wpcom-expiry-banner-height',
				`${ banner.offsetHeight }px`
			);
		setOffset();
		new ResizeObserver( setOffset ).observe( banner );
	}

	trackOncePerSession(
		`${ metaKey }_${ trackProps.surface }_impression_fired`,
		'jetpack_expiry_banner_impression',
		trackProps
	);

	banner
		.querySelectorAll< HTMLAnchorElement >( '[data-wpcom-expiry-cta]' )
		.forEach( link =>
			link.addEventListener( 'click', event =>
				clickCta(
					event,
					link.dataset.supportMessage,
					link.dataset.wpcomExpiryCta ?? 'primary',
					'jetpack_expiry_banner_cta_click',
					trackProps
				)
			)
		);

	const show = ( visible: boolean ) => {
		banner.style.display = visible ? '' : 'none';
		if ( isFrontend ) {
			document.body.classList.toggle( 'has-wpcom-expiry-banner', visible );
		}
	};
	banner.querySelector( '[data-wpcom-expiry-dismiss]' )?.addEventListener( 'click', () => {
		show( false );
		dismissNotice( metaKey, 'jetpack_expiry_banner_dismiss', trackProps, () => show( true ) );
	} );
}
