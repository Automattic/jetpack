/**
 * External dependencies
 */
import { useDispatch } from '@wordpress/data';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Card, Fieldset, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { updateNewsletterMode } from '../mode-api';
import { getNewsletterScriptData } from '../script-data';

/**
 * Local form shape. Deliberately NOT part of `NewsletterSettings` — the mode
 * flag lives in its own option and persists through its own package-owned route,
 * not the shared settings auto-save.
 */
interface ModeFormData {
	newsletter_mode_enabled: boolean;
}

/**
 * Newsletter Mode Section
 *
 * A single opt-in toggle that switches the experimental Newsletter Mode on/off.
 * Seeds from the bootstrapped `modeEnabled` script-data value and persists each
 * change through the package-owned REST route. The change applies on the next
 * page load (the write is async), which is expected.
 *
 * @return {JSX.Element} The Newsletter Mode section.
 */
export function NewsletterModeSection(): JSX.Element {
	const [ enabled, setEnabled ] = useState< boolean >(
		() => getNewsletterScriptData()?.modeEnabled ?? false
	);
	const [ isSaving, setIsSaving ] = useState( false );

	const { createNotice } = useDispatch( noticesStore );

	const fields: Field< ModeFormData >[] = [
		{
			id: 'newsletter_mode_enabled',
			label: __( 'Enable experimental Newsletter Mode', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
			description: __(
				'Turn the Newsletter page into a focused, distraction-free workspace. Changes apply the next time the page loads.',
				'jetpack-newsletter'
			),
		},
	];

	const onChange = useCallback(
		( updates: Partial< ModeFormData > ) => {
			if ( typeof updates.newsletter_mode_enabled !== 'boolean' ) {
				return;
			}

			const next = updates.newsletter_mode_enabled;
			const previous = enabled;

			// Optimistic update.
			setEnabled( next );
			setIsSaving( true );

			updateNewsletterMode( next )
				.then( () => {
					createNotice(
						'success',
						__(
							'Newsletter Mode updated. Reload the page to see the change.',
							'jetpack-newsletter'
						),
						{ type: 'snackbar' }
					);
				} )
				.catch( ( err: Error ) => {
					// eslint-disable-next-line no-console
					console.error( 'Newsletter Mode save error:', err );
					// Revert optimistic update on error.
					setEnabled( previous );
					createNotice(
						'error',
						err.message || __( 'Failed to update Newsletter Mode', 'jetpack-newsletter' ),
						{ type: 'snackbar', explicitDismiss: true }
					);
				} )
				.finally( () => {
					setIsSaving( false );
				} );
		},
		[ enabled, createNotice ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Newsletter Mode', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Fieldset.Root disabled={ isSaving }>
					<Stack gap="lg" direction="column">
						<DataForm
							data={ { newsletter_mode_enabled: enabled } }
							fields={ fields }
							form={ {
								layout: {
									type: 'regular',
									labelPosition: 'top',
								},
								fields: [ 'newsletter_mode_enabled' ],
							} }
							onChange={ onChange }
						/>
					</Stack>
				</Fieldset.Root>
			</Card.Content>
		</Card.Root>
	);
}
