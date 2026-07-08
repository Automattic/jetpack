/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { ToggleControl } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import type { NewsletterSettings } from '../types';

interface EmailDefaultsSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	isNewsletterEnabled: boolean;
}

/**
 * Email Defaults Section Component.
 *
 * Renders the "Email new posts to subscribers by default" toggle. The
 * legacy master `subscriptions` toggle that used to live here moved to
 * the global Newsletter module activation control — flipping the module
 * off-page disables this card via the orchestrator's `<Disabled>` wrapper.
 *
 * @param props                     - Component props.
 * @param props.data                - Newsletter settings data.
 * @param props.onChange            - Auto-save callback for setting updates.
 * @param props.isNewsletterEnabled - Whether the Newsletter module is on.
 * @return The email defaults section.
 */
export function EmailDefaultsSection( {
	data,
	onChange,
	isNewsletterEnabled,
}: EmailDefaultsSectionProps ): JSX.Element {
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'wpcom_newsletter_send_default',
			label: __( 'Email new posts to subscribers by default', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit( { field, onChange: onChangeField, data: formData } ) {
				const handleToggle = useCallback( () => {
					onChangeField(
						field.setValue( {
							item: formData,
							value: ! field.getValue( { item: formData } ),
						} )
					);
				}, [ onChangeField, field, formData ] );
				return (
					<ToggleControl
						label={ field.label }
						help={ field.description }
						checked={ !! field.getValue( { item: formData } ) }
						onChange={ handleToggle }
						disabled={ ! isSimpleSite() && ! isNewsletterEnabled }
					/>
				);
			},
			description: __(
				'When on, the newsletter option will be pre-selected each time you publish. You can change it in the newsletter panel in the editor before publishing any post.',
				'jetpack-newsletter'
			),
		},
	];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Email defaults', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<DataForm
					data={ data }
					fields={ fields }
					form={ {
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
						fields: [ 'wpcom_newsletter_send_default' ],
					} }
					onChange={ onChange }
				/>
			</Card.Content>
		</Card.Root>
	);
}
