import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';

/**
 * Root component for the Newsletter `/` route.
 *
 * Phase 1 placeholder. Phase 2 replaces this with the Subscribers DataViews
 * stage ported from the `subscribers-dashboard` package.
 *
 * @return Stage content.
 */
export default function App(): JSX.Element {
	const title = 'Newsletter'; /** "Newsletter" is a product name, do not translate. */
	return (
		<Page
			title={ title }
			ariaLabel={ title }
			subTitle={ __( 'Reach and grow your audience with newsletters.', 'jetpack-newsletter' ) }
		>
			<p>
				{ __(
					'Subscribers will live here. Use the Settings tab while we wire it up.',
					'jetpack-newsletter'
				) }
			</p>
		</Page>
	);
}
