import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dialog, Text } from '@wordpress/ui';
import { getNewsletterModeScriptData } from '../../src/settings/script-data';

/**
 * The WordPress mark with the Jetpack spark, as it appears in the mockup.
 *
 * Inline rather than an icon import: this pairing does not exist in
 * `@wordpress/icons`, and at one use it is not worth a shared component.
 *
 * @return The logo.
 */
const IntroLogo = (): JSX.Element => (
	<svg
		className="jetpack-newsletter-intro__logo"
		fill="none"
		height="24"
		viewBox="0 0 24 24"
		width="24"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path
			d="m22 12c0-5.51-4.49-10-10-10-5.52 0-10 4.49-10 10 0 5.52 4.48 10 10 10 5.51 0 10-4.48 10-10zm-12.22 5.37-3.41-9.15c.55-.02 1.17-.08 1.17-.08.5-.06.44-1.13-.06-1.11 0 0-1.45.11-2.37.11-.18 0-.37 0-.58-.01 1.59-2.44 4.34-4.02 7.47-4.02 2.33 0 4.45.87 6.05 2.34-.68-.11-1.65.39-1.65 1.58 0 .74.45 1.36.9 2.1.35.61.55 1.36.55 2.46 0 1.49-1.4 5-1.4 5l-3.03-8.37c.54-.02.82-.17.82-.17.5-.05.44-1.25-.06-1.22 0 0-1.44.12-2.38.12-.87 0-2.33-.12-2.33-.12-.5-.03-.56 1.2-.06 1.22l.92.08 1.26 3.41zm9.63-5.37c.24-.64.74-1.87.43-4.25.7 1.29 1.05 2.71 1.05 4.25 0 3.29-1.73 6.24-4.4 7.78.97-2.59 1.94-5.2 2.92-7.78zm-11.31 8.09c-2.98-1.44-4.99-4.56-4.99-8.09 0-1.3.23-2.48.72-3.59 1.42 3.89 2.84 7.79 4.27 11.68zm4.03-6.63 2.58 6.98c-.86.29-1.76.45-2.71.45-.79 0-1.57-.11-2.29-.33.81-2.38 1.62-4.74 2.42-7.1z"
			fill="#1e1e1e"
		/>
		<circle cx="19" cy="6" fill="#fff" r="5" />
		<path
			d="m19.0008 2c-2.2037 0-4 1.79141-4 4s1.7914 4 4 4 4-1.79141 4-4-1.7914-4-4-4zm-.2061 4.66258h-1.9927l1.9927-3.8773zm.4073 2.54233v-3.8773h1.9877z"
			fill="#069e08"
		/>
	</svg>
);

/**
 * The one-time introduction to Newsletter Mode.
 *
 * Shown on the Dashboard the first time someone arrives, and never again once
 * they have acknowledged it. Both ways out — the button and the backdrop — are
 * the same acknowledgement: there is nothing to decide here, so dismissing it
 * any way counts as having seen it.
 *
 * @return The modal, or nothing once it has been seen.
 */
export const IntroModal = (): JSX.Element | null => {
	// Seeded from script data so a returning visitor never sees it flash before a
	// fetch resolves.
	const [ isOpen, setOpen ] = useState( () => getNewsletterModeScriptData()?.introSeen !== true );
	const artUrl = getNewsletterModeScriptData()?.introArtUrl;

	const dismiss = useCallback( () => {
		setOpen( false );

		// Nothing is riding on this write: the worst case is seeing the intro once
		// more, which is better than blocking the Dashboard behind a request.
		apiFetch( {
			path: '/jetpack-newsletter/v1/intro-seen',
			method: 'POST',
			data: { seen: true },
		} ).catch( () => {} );
	}, [] );

	// `Dialog.Root` calls this for the backdrop and for Escape as well as the
	// button, so all three land in the same place.
	const handleOpenChange = useCallback(
		( next: boolean ) => {
			if ( ! next ) {
				dismiss();
			}
		},
		[ dismiss ]
	);

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup className="jetpack-newsletter-intro">
				<div className="jetpack-newsletter-intro__body">
					<IntroLogo />
					{ /* `Dialog.Title` rather than a plain heading: it is what names the
					     dialog for assistive technology, and here the visible heading is
					     the right name for it. */ }
					<Dialog.Title render={ <h2 /> } className="jetpack-newsletter-intro__title">
						{ __( 'The new home for your Newsletter', 'jetpack-newsletter' ) }
					</Dialog.Title>
					<Text variant="body-md" render={ <p /> } className="jetpack-newsletter-intro__lede">
						{ __(
							"This is your newsletter, and it's as simple as it looks. Write something short, share it with a few people who already know you, and you're on your way.",
							'jetpack-newsletter'
						) }
					</Text>
					<Button onClick={ dismiss } className="jetpack-newsletter-intro__cta">
						{ __( 'Got it', 'jetpack-newsletter' ) }
					</Button>
				</div>
				{ /* Decorative: the copy beside it already says everything this conveys,
				     so an empty alt keeps it out of the way of a screen reader. The URL
				     comes from the server — see `Mode::get_intro_art_url()` for why it is
				     not imported. */ }
				{ artUrl && <img className="jetpack-newsletter-intro__art" src={ artUrl } alt="" /> }
			</Dialog.Popup>
		</Dialog.Root>
	);
};
