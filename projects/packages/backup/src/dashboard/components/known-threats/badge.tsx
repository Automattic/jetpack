import { __, sprintf } from '@wordpress/i18n';
import { Icon, caution } from '@wordpress/icons';
import './badge.scss';

/**
 * The orange "Known threats (N)" pill, as WordPress.com shows it.
 *
 * @param props       - Component props.
 * @param props.count - Number of malware and database threats in the backup.
 * @return The badge.
 */
export function KnownThreatsBadge( { count }: { count: number } ) {
	return (
		<span className="jpb-known-threats-badge">
			<Icon icon={ caution } size={ 16 } aria-hidden="true" />
			{ sprintf(
				/* translators: %d: number of known security threats in a backup. */
				__( 'Known threats (%d)', 'jetpack-backup-pkg' ),
				count
			) }
		</span>
	);
}

type ToggleProps = {
	count: number;
	open: boolean;
	onToggle: () => void;
	/** Id of the element the toggle shows and hides. */
	controls?: string;
};

/**
 * The badge as a button that shows and hides the list of threats.
 *
 * @param props          - Component props.
 * @param props.count    - Number of malware and database threats in the backup.
 * @param props.open     - Whether the list is shown.
 * @param props.onToggle - Called on click.
 * @param props.controls - Id of the list element.
 * @return The toggle.
 */
export function KnownThreatsToggle( { count, open, onToggle, controls }: ToggleProps ) {
	const label = open
		? sprintf(
				/* translators: %d: number of known security threats in a backup; the button hides the list of threats. */
				__( 'Known threats (%d), hide threats', 'jetpack-backup-pkg' ),
				count
			)
		: sprintf(
				/* translators: %d: number of known security threats in a backup; the button shows the list of threats. */
				__( 'Known threats (%d), show threats', 'jetpack-backup-pkg' ),
				count
			);

	return (
		<button
			type="button"
			className="jpb-known-threats-toggle"
			aria-label={ label }
			aria-expanded={ open }
			// Only while the list is in the page; it is not rendered while hidden.
			aria-controls={ open ? controls : undefined }
			title={
				open
					? __( 'Hide threats', 'jetpack-backup-pkg' )
					: __( 'Show threats', 'jetpack-backup-pkg' )
			}
			onClick={ onToggle }
		>
			<KnownThreatsBadge count={ count } />
		</button>
	);
}
