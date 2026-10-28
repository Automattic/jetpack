import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, InputControl, Notice, Stack, Text } from '@wordpress/ui';
import useOpenThreat from '../use-open-threat';
import { fixThreat } from './threat-actions';
import type { ScanThreat } from './types';
import type { RenderModalProps } from '@wordpress/dataviews';
import type { ChangeEvent } from 'react';

/**
 * Whether Scan's fix for the threat deletes the plugin or theme it is in.
 *
 * @param threat - The threat.
 * @return True when the fix deletes the software.
 */
export function isDeleteFix( threat: ScanThreat ): boolean {
	return (
		threat.signature === 'Vulnerable.WP.Extension' &&
		!! threat.fixable &&
		threat.fixable.fixer === 'delete'
	);
}

/**
 * The confirmation's title: "Delete this plugin?" or "Delete this theme?".
 *
 * @param threat - A threat whose fix deletes its software.
 * @return The title.
 */
export function getDeleteFixTitle( threat: ScanThreat ): string {
	return threat.extension?.type === 'themes'
		? __( 'Delete this theme?', 'jetpack-protect-pkg' )
		: __( 'Delete this plugin?', 'jetpack-protect-pkg' );
}

/**
 * The risks of the fix, a field for the software's slug, and Cancel and Confirm deletion.
 *
 * @param props           - Component props.
 * @param props.threat    - A threat whose fix deletes its software.
 * @param props.onCancel  - Closes the confirmation.
 * @param props.onConfirm - Starts the fix, once the slug matches.
 * @return The confirmation.
 */
export function FixDeleteConfirmation( {
	threat,
	onCancel,
	onConfirm,
}: {
	threat: ScanThreat;
	onCancel?: () => void;
	onConfirm: () => void;
} ) {
	const [ confirmation, setConfirmation ] = useState( '' );
	const onChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => setConfirmation( event.target.value ),
		[]
	);
	const isTheme = threat.extension?.type === 'themes';
	const slug = threat.extension?.slug || 'unknown-slug';
	const fixable = threat.fixable || undefined;
	// The site's live state wins over the scan report, which may predate an activation.
	const state = threat.extension?.state ?? fixable?.extensionStatus;
	const isActive = state === 'active' || state === 'parent';

	let risk: string;
	if ( isActive ) {
		risk = isTheme
			? __(
					'This theme seems to be currently active on your site. Deleting it may break your site. Please disable it first and check if your site is still working as expected, then proceed with the fix.',
					'jetpack-protect-pkg'
				)
			: __(
					'This plugin seems to be currently active on your site. Deleting it may break your site. Please disable it first and check if your site is still working as expected, then proceed with the fix.',
					'jetpack-protect-pkg'
				);
	} else {
		risk = isTheme
			? __(
					'This theme seems to not currently be active on your site. Please note that deleting it may still have adverse effects and this action cannot be undone.',
					'jetpack-protect-pkg'
				)
			: __(
					'This plugin seems to not currently be active on your site. Please note that deleting it may still have adverse effects and this action cannot be undone.',
					'jetpack-protect-pkg'
				);
	}

	const instructions = isTheme
		? sprintf(
				/* translators: %s is the theme slug itself, e.g. twentytwentyfive. */
				__(
					'To confirm you have read and understood the consequences, please enter the theme slug <code>%s</code> in the field below.',
					'jetpack-protect-pkg'
				),
				slug
			)
		: sprintf(
				/* translators: %s is the plugin slug itself, e.g. jetpack-protect. */
				__(
					'To confirm you have read and understood the consequences, please enter the plugin slug <code>%s</code> in the field below.',
					'jetpack-protect-pkg'
				),
				slug
			);

	return (
		<Stack direction="column" gap="lg">
			<Notice.Root intent={ isActive ? 'error' : 'warning' }>
				<Notice.Description>{ risk }</Notice.Description>
			</Notice.Root>
			{ fixable?.extras?.isDotorg === false && (
				<Text variant="body-md">
					{ isTheme
						? __(
								'We did not find this theme on WordPress.org. We encourage you to create a backup of your site before fixing this threat, to keep a copy of it.',
								'jetpack-protect-pkg'
							)
						: __(
								'We did not find this plugin on WordPress.org. We encourage you to create a backup of your site before fixing this threat, to keep a copy of it.',
								'jetpack-protect-pkg'
							) }
				</Text>
			) }
			<Text variant="body-md">
				{ createInterpolateElement( instructions, { code: <code /> } ) }
			</Text>
			<InputControl
				label={ __( 'Confirmation', 'jetpack-protect-pkg' ) }
				hideLabelFromVision
				value={ confirmation }
				onChange={ onChange }
				autoComplete="off"
			/>
			<Stack direction="row" gap="sm" justify="end">
				<Button variant="minimal" tone="neutral" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack-protect-pkg' ) }
				</Button>
				<Button onClick={ onConfirm } disabled={ confirmation !== slug }>
					{ __( 'Confirm deletion', 'jetpack-protect-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

/**
 * The Auto-fix row action's confirmation, for a fix that deletes the software.
 *
 * @param props            - DataViews modal props.
 * @param props.items      - The threat, as a one-item list.
 * @param props.closeModal - Closes the confirmation.
 * @return The confirmation.
 */
export function FixDeleteModal( { items, closeModal }: RenderModalProps< ScanThreat > ) {
	const [ threat ] = items;
	const open = useOpenThreat();
	const onConfirm = useCallback( () => {
		closeModal?.();
		fixThreat( threat, open );
	}, [ threat, open, closeModal ] );
	if ( ! threat ) {
		return null;
	}
	return (
		<FixDeleteConfirmation threat={ threat } onCancel={ closeModal } onConfirm={ onConfirm } />
	);
}
