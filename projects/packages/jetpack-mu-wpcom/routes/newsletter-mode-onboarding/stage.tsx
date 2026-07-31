import { __ } from '@wordpress/i18n';
import { NewsletterModePageShell } from '../../src/features/newsletter-mode/js/page-shell';

/**
 * Newsletter Mode onboarding route placeholder.
 *
 * @return Onboarding route stage.
 */
const Stage = (): JSX.Element => (
	<NewsletterModePageShell>
		<section
			className="wpcom-newsletter-mode-page"
			aria-labelledby="wpcom-newsletter-mode-onboarding-title"
		>
			<h2 id="wpcom-newsletter-mode-onboarding-title">
				{ __( 'Newsletter setup', 'jetpack-mu-wpcom' ) }
			</h2>
			<p>{ __( 'This page is ready for its feature content.', 'jetpack-mu-wpcom' ) }</p>
		</section>
	</NewsletterModePageShell>
);

export { Stage as stage };
