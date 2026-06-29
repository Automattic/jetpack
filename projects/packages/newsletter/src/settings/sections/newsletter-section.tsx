/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { getSiteType, isSimpleSite } from '@automattic/jetpack-script-data';
import { ToggleControl } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';
import type { NewsletterSettings } from '../types';

interface NewsletterSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
}

/**
 * Newsletter Section Component — legacy (flag-OFF) surface only.
 *
 * Hosts the always-editable `subscriptions` master toggle plus the
 * `wpcom_newsletter_send_default` toggle, with the Privacy / Manage
 * subscribers footer links. The modernized chassis splits this card up
 * (master toggle moves to the global Newsletter module activation,
 * `wpcom_newsletter_send_default` becomes its own `EmailDefaultsSection`,
 * privacy/manage links are dropped) — this file is preserved verbatim so
 * the legacy `wp-admin/admin.php?page=jetpack-newsletter` experience does
 * not change while the modernization flag is off. Both the file and the
 * legacy variant of `SubscriptionsSection` retire together in #48613.
 *
 * @param {NewsletterSectionProps} props - Component props.
 * @return {JSX.Element} The newsletter section.
 */
export function NewsletterSection( { data, onChange }: NewsletterSectionProps ): JSX.Element {
	const newsletterScriptData = getNewsletterScriptData();
	const siteType = getSiteType();
	const previousSubscriptionsValue = useRef( data.subscriptions );

	const handleChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if (
				'subscriptions' in updates &&
				updates.subscriptions !== previousSubscriptionsValue.current
			) {
				analytics.tracks.recordEvent( 'jetpack_newsletter_module_toggle', {
					site_type: siteType,
					enabled: !! updates.subscriptions,
				} );
				previousSubscriptionsValue.current = !! updates.subscriptions;
			}
			onChange( updates );
		},
		[ onChange, siteType ]
	);

	const handleManageSubscribersClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_manage_subscribers_click', {
			site_type: siteType,
		} );
	}, [ siteType ] );

	const fields: Field< NewsletterSettings >[] = [
		...( ! isSimpleSite()
			? [
					{
						id: 'subscriptions',
						label: __(
							'Let visitors subscribe to this site and receive emails when you publish a post',
							'jetpack-newsletter'
						),
						type: 'boolean' as const,
						Edit: 'toggle' as const,
					},
			  ]
			: [] ),
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
						disabled={ ! isSimpleSite() && ! formData.subscriptions }
					/>
				);
			},
			description: __(
				'When on, the newsletter option will be pre-selected each time you publish. You can change it in the newsletter panel in the editor before publishing any post.',
				'jetpack-newsletter'
			),
		},
	];

	const formFields = [
		...( ! isSimpleSite() ? [ 'subscriptions' ] : [] ),
		'wpcom_newsletter_send_default',
	];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Newsletter', 'jetpack-newsletter' ) }</Card.Title>
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
						fields: formFields,
					} }
					onChange={ handleChange }
				/>
				<div className="newsletter-card-footer">
					<Link
						openInNewTab
						href={ getRedirectUrl( 'jetpack-support-subscriptions', { anchor: 'privacy' } ) }
					>
						{ __( 'Privacy information', 'jetpack-newsletter' ) }
					</Link>
					{ data.subscriptions && newsletterScriptData && (
						<Link
							openInNewTab
							href={ newsletterScriptData.subscriberManagementUrl }
							onClick={ handleManageSubscribersClick }
						>
							{ __( 'Manage all subscribers', 'jetpack-newsletter' ) }
						</Link>
					) }
				</div>
			</Card.Content>
		</Card.Root>
	);
}
