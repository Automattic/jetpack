/**
 * Footer — the Beta Tester page footer.
 *
 * Mirrors `@automattic/jetpack-components`' JetpackFooter (Jetpack logo + the
 * Automattic byline) but deliberately omits its hard-coded "Products" and
 * "Help" menu links, which aren't relevant to the Beta Tester screen.
 *
 * @package
 */

import { AutomatticBylineLogo, JetpackLogo, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

/**
 * Page footer with the Jetpack mark and the Automattic byline.
 *
 * @return The footer element.
 */
const Footer = () => (
	<Stack
		render={ <footer /> }
		// `jetpack-footer` hooks the jetpack-admin-page-layout mixin that pins
		// the footer to the bottom; `jetpack-beta-footer` carries our styling.
		className="jetpack-footer jetpack-beta-footer"
		aria-label={ __( 'Jetpack', 'jetpack-beta' ) }
		role="contentinfo"
		direction="row"
		justify="flex-start"
		align="center"
		wrap="wrap"
		gap="xl"
	>
		<Stack direction="row" gap="sm" align="center">
			<JetpackLogo showText={ false } height={ 16 } aria-hidden="true" />
			<Text variant="body-md">Jetpack</Text>
		</Stack>
		<a
			className="jetpack-beta-footer__a8c"
			href={ getRedirectUrl( 'a8c-about' ) }
			rel="noopener noreferrer"
			target="_blank"
			aria-label={ __( 'An Automattic Airline (opens in a new tab)', 'jetpack-beta' ) }
		>
			<AutomatticBylineLogo height={ 8 } />
		</a>
	</Stack>
);

export default Footer;
