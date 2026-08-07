import { __ } from '@wordpress/i18n';
import { NewsletterModePageShell } from '../../src/features/newsletter-mode/js/page-shell';

/**
 * Newsletter Mode stats route placeholder.
 *
 * @return Stats route stage.
 */
const Stage = (): JSX.Element => (
	<NewsletterModePageShell>
		<section
			className="wpcom-newsletter-mode-page"
			aria-labelledby="wpcom-newsletter-mode-stats-title"
		>
			<h2 id="wpcom-newsletter-mode-stats-title">
				{ __( 'Stats dashboard', 'jetpack-mu-wpcom' ) }
			</h2>
			<p>{ __( 'This page is ready for its feature content.', 'jetpack-mu-wpcom' ) }</p>
		</section>
	</NewsletterModePageShell>
);

export { Stage as stage };
