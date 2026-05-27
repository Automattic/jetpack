/**
 * `<OverviewEmptyState>` — shown on the Overview tab when no Akismet
 * key is configured. Centered hero: icon → headline → sub → primary
 * button. Drops the @wordpress/components Notice in favor of a proper
 * empty-state surface matching modern WP.com onboarding panels.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type Props = {
	onGoToAccount: () => void;
};

/**
 * Render the no-key empty state.
 *
 * @param props - The component props.
 * @return The rendered hero.
 */
export function OverviewEmptyState( props: Props ): JSX.Element {
	const { onGoToAccount } = props;
	return (
		<section className="akismet-overview-empty">
			<span className="akismet-overview-empty__icon" aria-hidden="true">
				<span className="dashicons dashicons-shield" />
			</span>
			<h2 className="akismet-overview-empty__title">
				{ __( 'Turn on protection for this site', 'akismet' ) }
			</h2>
			<p className="akismet-overview-empty__body">
				{ __(
					'Connect Akismet to start filtering spam, blocking bots, and protecting logins, checkouts, and forms — all from one place.',
					'akismet'
				) }
			</p>
			<div className="akismet-overview-empty__button">
				<Button variant="primary" onClick={ onGoToAccount } __next40pxDefaultSize>
					{ __( 'Connect Akismet', 'akismet' ) }
				</Button>
			</div>
		</section>
	);
}
