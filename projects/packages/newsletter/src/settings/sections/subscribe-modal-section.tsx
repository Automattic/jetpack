/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link';
import { DataForm, type Field } from '@wordpress/dataviews';
import { createInterpolateElement, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Fieldset, Link, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import type { NewsletterSettings } from '../types';

interface SubscribeModalSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	/** Setting keys staged in this section's changeset, fed into section_save analytics. */
	changedKeys?: string[];
	isNewsletterEnabled: boolean;
}

// Flattened data structure for DataForm
interface SubscribeModalFormData {
	subscribe_modal_heading: string;
}

/**
 * Subscribe Modal Section Component
 *
 * Configures the heading shown above the email input in the Subscribe block's modal popup.
 * Only takes effect when a Subscribe block uses the "Button only" style.
 *
 * @param {SubscribeModalSectionProps} props - Component props
 * @return {JSX.Element} The subscribe modal section
 */
export function SubscribeModalSection( {
	data,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	changedKeys,
	isNewsletterEnabled,
}: SubscribeModalSectionProps ): JSX.Element {
	const siteType = getSiteType();

	const formData: SubscribeModalFormData = useMemo(
		() => ( {
			subscribe_modal_heading: data.subscription_options?.subscribe_modal_heading || '',
		} ),
		[ data.subscription_options?.subscribe_modal_heading ]
	);

	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'subscribe_modal',
			changed_keys: ( changedKeys ?? [] ).join( ',' ),
			change_count: ( changedKeys ?? [] ).length,
		} );
		onSave();
	}, [ changedKeys, onSave, siteType ] );

	const isWpcom = isWpcomPlatformSite();
	const buttonOnlyStyleUrl = isWpcom
		? 'https://wordpress.com/support/wordpress-editor/blocks/subscribe-block/#change-the-subscription-box-appearance'
		: 'https://jetpack.com/support/jetpack-blocks/subscription-form-block/#use-the-button-only-style';

	const ButtonOnlyStyleLink = isWpcom ? (
		<WpcomSupportLink supportLink={ buttonOnlyStyleUrl } supportPostId={ 170164 } />
	) : (
		<Link openInNewTab href={ buttonOnlyStyleUrl } children={ null } />
	);

	const fields: Field< SubscribeModalFormData >[] = [
		{
			id: 'subscribe_modal_heading',
			label: __( 'Subscribe modal heading', 'jetpack-newsletter' ),
			type: 'text' as const,
			Edit: 'textarea' as const,
			placeholder: __( 'Subscribe now to stay ahead and never miss a beat!', 'jetpack-newsletter' ),
			description: createInterpolateElement(
				__(
					'Only affects Subscribe blocks using <link>the "Button only" style</link>. Leave blank to use the default heading.',
					'jetpack-newsletter'
				),
				{
					link: ButtonOnlyStyleLink,
				}
			),
		},
	];

	const handleDataFormChange = useCallback(
		( updates: Partial< SubscribeModalFormData > ) => {
			if ( updates.subscribe_modal_heading !== undefined ) {
				// Preserve all properties of subscription_options when updating
				onChange( {
					subscription_options: {
						invitation: data.subscription_options?.invitation || '',
						welcome: data.subscription_options?.welcome || '',
						comment_follow: data.subscription_options?.comment_follow || '',
						subscribe_modal_heading: updates.subscribe_modal_heading,
					},
				} );
			}
		},
		[ onChange, data.subscription_options ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Subscribe modal heading', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<p>
					<Text>
						{ __(
							'Shown at the top of the subscribe popup that appears when a visitor clicks a Subscribe block. Only applies to blocks using the "Button only" style.',
							'jetpack-newsletter'
						) }
					</Text>
				</p>
				<Fieldset.Root disabled={ ! isNewsletterEnabled }>
					<DataForm
						data={ formData }
						fields={ fields }
						form={ {
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
							fields: [ 'subscribe_modal_heading' ],
						} }
						onChange={ handleDataFormChange }
					/>
				</Fieldset.Root>
				<div className="newsletter-card-footer">
					<Button
						onClick={ handleSave }
						disabled={ ! isNewsletterEnabled || isSaving || ! hasChanges }
						loading={ isSaving }
						loadingAnnouncement={ savingText }
					>
						{ saveText }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
