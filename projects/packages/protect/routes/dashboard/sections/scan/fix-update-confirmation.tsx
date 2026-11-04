import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import useOpenThreat from '../use-open-threat';
import { fixThreats, isBulkFixable, refocusRow, useGetThreatBusy } from './threat-actions';
import type { ScanThreat } from './types';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * The threats a confirmed update starts, as fixThreats leaves out the ones Scan fixes only one at a time.
 *
 * @param threats - Threats whose fixes update their software.
 * @return The threats that will be updated.
 */
export const getUpdated = ( threats: ScanThreat[] ) =>
	threats.length > 1 ? threats.filter( isBulkFixable ) : threats;

/**
 * The name of the software a threat's fix updates.
 *
 * @param threat - A threat whose fix updates its software.
 * @return The name.
 */
const getName = ( threat: ScanThreat ) => threat.extension?.name || threat.title || '';

/**
 * The confirmation's title: "Update this plugin?", "Update this theme?" or "Apply 3 updates?".
 *
 * @param threats - Threats whose fixes update their software.
 * @return The title.
 */
export function getUpdateFixTitle( threats: ScanThreat[] ): string {
	const updated = getUpdated( threats );
	if ( updated.length > 1 ) {
		return sprintf(
			/* translators: %d is a number of plugin and theme updates, two or more. */
			_n( 'Apply %d update?', 'Apply %d updates?', updated.length, 'jetpack-protect-pkg' ),
			updated.length
		);
	}
	const type = ( updated[ 0 ] ?? threats[ 0 ] )?.extension?.type;
	if ( type === 'core' ) {
		return __( 'Update WordPress?', 'jetpack-protect-pkg' );
	}
	return type === 'themes'
		? __( 'Update this theme?', 'jetpack-protect-pkg' )
		: __( 'Update this plugin?', 'jetpack-protect-pkg' );
}

/**
 * What one update changes: "WPForms Lite: 1.7.4 to 2.0.3.1".
 *
 * @param threat - A threat whose fix updates its software.
 * @return The change.
 */
function describeUpdate( threat: ScanThreat ): string {
	const name = getName( threat );
	const from = threat.extension?.version;
	const to = threat.fixable ? threat.fixable.target : null;
	if ( from && to ) {
		return sprintf(
			/* translators: 1: a plugin or theme name. 2: its installed version. 3: the version Auto-fix updates it to. */
			__( '%1$s: %2$s to %3$s', 'jetpack-protect-pkg' ),
			name,
			from,
			to
		);
	}
	return name;
}

/**
 * The plugins and themes Auto-fix will update and their versions, with Cancel and Update.
 *
 * @param props           - Component props.
 * @param props.threats   - Threats whose fixes update their software.
 * @param props.isBusy    - Whether another action is running on the threat, so the fix can't start.
 * @param props.onCancel  - Closes the confirmation.
 * @param props.onConfirm - Starts the fixes.
 * @return The confirmation.
 */
export function FixUpdateConfirmation( {
	threats,
	isBusy = false,
	onCancel,
	onConfirm,
}: {
	threats: ScanThreat[];
	isBusy?: boolean;
	onCancel?: () => void;
	onConfirm: () => void;
} ) {
	const updated = getUpdated( threats );
	const [ only ] = updated;
	const skipped = threats.length - updated.length;

	let summary = '';
	if ( updated.length > 1 ) {
		summary = __(
			'Auto-fix will update these to versions without the vulnerability:',
			'jetpack-protect-pkg'
		);
	} else if ( only?.extension?.version && only.fixable && only.fixable.target ) {
		summary = sprintf(
			/* translators: 1: a plugin or theme name. 2: its installed version. 3: the version Auto-fix updates it to. */
			__( 'Auto-fix will update %1$s from version %2$s to %3$s.', 'jetpack-protect-pkg' ),
			getName( only ),
			only.extension.version,
			only.fixable.target
		);
	} else if ( only ) {
		summary = sprintf(
			/* translators: %s is a plugin or theme name. */
			__(
				'Auto-fix will update %s to a version without the vulnerability.',
				'jetpack-protect-pkg'
			),
			getName( only )
		);
	}

	return (
		<Stack direction="column" gap="lg">
			{ summary && <Text variant="body-md">{ summary }</Text> }
			{ updated.length > 1 && (
				<ul className="jp-protect-fix-update__list">
					{ updated.map( threat => (
						<li key={ threat.id }>{ describeUpdate( threat ) }</li>
					) ) }
				</ul>
			) }
			{ skipped > 0 && (
				<Text variant="body-md">
					{ sprintf(
						/* translators: %d is a number of threats. */
						_n(
							'%d other threat can only be fixed on its own, so it is left out.',
							'%d other threats can only be fixed on their own, so they are left out.',
							skipped,
							'jetpack-protect-pkg'
						),
						skipped
					) }
				</Text>
			) }
			<Notice.Root intent="warning">
				<Notice.Description>
					{ __(
						'An update can change how your site works, and Auto-fix can’t undo it. Check your site once it is done.',
						'jetpack-protect-pkg'
					) }
				</Notice.Description>
			</Notice.Root>
			<Stack direction="row" gap="sm" justify="end">
				<Button variant="minimal" tone="neutral" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-protect-pkg' ) }
				</Button>
				<Button onClick={ onConfirm } disabled={ isBusy || ! updated.length }>
					{ __( 'Update', 'jetpack-protect-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

/**
 * The Auto-fix action's confirmation, for one or several fixes that update the software.
 *
 * @param onStart - Gets the threats the confirmed fix starts on, as bulk actions do.
 * @return The DataViews modal.
 */
export function makeFixUpdateModal( onStart?: ( threats: ScanThreat[] ) => void ) {
	return function FixUpdateModal( { items, closeModal }: RenderModalProps< ScanThreat > ) {
		const open = useOpenThreat();
		const getBusy = useGetThreatBusy();
		const onConfirm = useCallback( () => {
			const [ first ] = items;
			closeModal?.();
			onStart?.( items );
			fixThreats( items, open );
			if ( first ) {
				setTimeout( () => refocusRow( first ) );
			}
		}, [ items, open, closeModal ] );
		return (
			<FixUpdateConfirmation
				threats={ items }
				isBusy={ items.some( item => getBusy( item.id ) ) }
				onCancel={ closeModal }
				onConfirm={ onConfirm }
			/>
		);
	};
}
