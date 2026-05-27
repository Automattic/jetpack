/**
 * `<OverviewEmptyState>` — shown on the Overview tab when no Akismet
 * key is configured. Points the reviewer at the Account tab.
 *
 * Kept minimal; the Account tab's <ConnectFlow> is the actual onboarding.
 */
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type Props = {
	onGoToAccount: () => void;
};

/**
 * Render the no-key empty state.
 *
 * @param props - The component props.
 * @return The rendered notice.
 */
export function OverviewEmptyState( props: Props ): JSX.Element {
	const { onGoToAccount } = props;
	return (
		<div className="akismet-overview-empty">
			<Notice status="info" isDismissible={ false }>
				<p>{ __( 'Connect Akismet to start seeing protection data for this site.', 'akismet' ) }</p>
				<button type="button" className="components-button is-primary" onClick={ onGoToAccount }>
					{ __( 'Go to Account', 'akismet' ) }
				</button>
			</Notice>
		</div>
	);
}
