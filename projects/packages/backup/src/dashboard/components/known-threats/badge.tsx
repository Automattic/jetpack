import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, caution } from '@wordpress/icons';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';
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

/**
 * The badge where the warning itself isn't shown: the warning is its tooltip on hover, and
 * hidden text for screen readers (the badge isn't focusable, so the tooltip can't be reached
 * from the keyboard).
 *
 * @param props       - Component props.
 * @param props.count - Number of malware and database threats in the backup.
 * @return The badge.
 */
export function KnownThreatsBadgeWithWarning( { count }: { count: number } ) {
	const warning = sprintf(
		/* translators: %d: number of known security threats in the backup. */
		_n(
			'This backup is known to contain %d security threat. Restoring it may bring malware back to your site.',
			'This backup is known to contain %d security threats. Restoring it may bring malware back to your site.',
			count,
			'jetpack-backup-pkg'
		),
		count
	);

	return (
		<Tooltip.Root>
			<Tooltip.Trigger render={ <span className="jpb-known-threats-badge-wrap" /> }>
				<KnownThreatsBadge count={ count } />
				<VisuallyHidden render={ <span /> }>{ warning }</VisuallyHidden>
			</Tooltip.Trigger>
			<Tooltip.Popup>{ warning }</Tooltip.Popup>
		</Tooltip.Root>
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
 * The badge as a button that shows and hides the list of threats. Its name is the badge's
 * text; `aria-expanded` says whether the list is shown.
 *
 * @param props          - Component props.
 * @param props.count    - Number of malware and database threats in the backup.
 * @param props.open     - Whether the list is shown.
 * @param props.onToggle - Called on click.
 * @param props.controls - Id of the list element.
 * @return The toggle.
 */
export function KnownThreatsToggle( { count, open, onToggle, controls }: ToggleProps ) {
	return (
		<button
			type="button"
			className="jpb-known-threats-toggle"
			aria-expanded={ open }
			// Only while the list is in the page; it is not rendered while hidden.
			aria-controls={ open ? controls : undefined }
			onClick={ onToggle }
		>
			<KnownThreatsBadge count={ count } />
		</button>
	);
}
