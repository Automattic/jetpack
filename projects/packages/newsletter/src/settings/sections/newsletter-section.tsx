/**
 * External dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getManageSubscribersUrl } from '../utils';
import type { NewsletterSettings, JetpackNewsletterSettings } from '../types';

interface NewsletterSectionProps {
	data: NewsletterSettings;
	jetpackSettings: JetpackNewsletterSettings | undefined;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
}

/**
 * Newsletter Section Component
 *
 * @param {NewsletterSectionProps} props - Component props
 * @return {JSX.Element} The newsletter section
 */
export function NewsletterSection( {
	data,
	jetpackSettings,
	onChange,
}: NewsletterSectionProps ): JSX.Element {
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'subscriptions',
			label: __(
				'Let visitors subscribe to this site and receive emails when you publish a post',
				'jetpack-newsletter'
			),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
	];

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Newsletter', 'jetpack-newsletter' ) }
			</h3>
			<div className="newsletter-settings__section-content">
				<DataForm
					data={ data }
					fields={ fields }
					form={ {
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
						fields: [ 'subscriptions' ],
					} }
					onChange={ onChange }
				/>
				{ data.subscriptions && (
					<div className="newsletter-settings__link">
						<ExternalLink href={ getManageSubscribersUrl( jetpackSettings ) }>
							{ __( 'Manage all subscribers', 'jetpack-newsletter' ) }
						</ExternalLink>
					</div>
				) }
			</div>
		</div>
	);
}
