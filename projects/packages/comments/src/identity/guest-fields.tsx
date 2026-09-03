import { useContext, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { EmailIcon, NameIcon, WebsiteIcon } from '../ui/icons';
import { Toggle } from '../ui/toggle';
import { Disclosure, ProviderButtons } from './checkpoint/provider-buttons';
import type { Commenter } from '../shared/types';

import '../ui/style.scss';
import './style.scss';

/**
 * Email, name and website for a reader who is not logged in to this site.
 *
 * These use core's own field names, so wp-comments-post.php reads them unchanged.
 *
 * @return The guest fields.
 */
export const GuestFields = () => {
	const { commenter } = useContext( CommentSignals );
	const { requireNameEmail, showCookiesConsent, strings, checkpoint } = JetpackComments;

	const hasSavedDetails = !! JetpackComments.commenter.email;

	// The fields sit behind the row's mail button, Verbum-style, except where
	// they cannot: a site that requires name and email keeps them open (a
	// collapsed required field would block native validation), and a site with
	// no checkpoint has no row to hide them behind.
	const hasProviderRow = checkpoint.enabled && checkpoint.providers.length > 0;
	const [ guestOpen, setGuestOpen ] = useState( requireNameEmail || ! hasProviderRow );

	const update = ( field: keyof Commenter, value: string ) => {
		commenter.value = { ...commenter.value, [ field ]: value };
	};

	const fields = [
		{
			field: 'email' as const,
			name: 'email',
			type: 'email',
			autoComplete: 'email',
			icon: <EmailIcon />,
			label: strings.email,
			placeholder: strings.emailPlaceholder,
			required: requireNameEmail,
		},
		{
			field: 'author' as const,
			name: 'author',
			type: 'text',
			autoComplete: 'name',
			icon: <NameIcon />,
			label: strings.name,
			placeholder: strings.name,
			required: requireNameEmail,
		},
		{
			field: 'url' as const,
			name: 'url',
			type: 'text',
			autoComplete: 'url',
			icon: <WebsiteIcon />,
			label: strings.website,
			placeholder: strings.websitePlaceholder,
			required: false,
		},
	];

	return (
		<div className="jetpack-comments__identity">
			<p className="jetpack-comments__prompt">
				{ requireNameEmail ? strings.guestPromptRequired : strings.guestPrompt }
			</p>
			<ProviderButtons
				guestOpen={ guestOpen }
				onGuestClick={ requireNameEmail ? undefined : () => setGuestOpen( ! guestOpen ) }
			/>
			<div className={ 'jetpack-comments__guest-reveal' + ( guestOpen ? ' is-open' : '' ) }>
				<div>
					<div className="jetpack-comments__guest">
						{ fields.map( field => (
							<label
								key={ field.name }
								className="jetpack-comments__guest-field"
								htmlFor={ field.name }
							>
								{ field.icon }
								<span className="jetpack-comments__visually-hidden">{ field.label }</span>
								<input
									id={ field.name }
									name={ field.name }
									type={ field.type }
									autoComplete={ field.autoComplete }
									required={ field.required }
									value={ commenter.value[ field.field ] }
									placeholder={ field.placeholder }
									onInput={ event => update( field.field, event.currentTarget.value ) }
								/>
							</label>
						) ) }
						{ showCookiesConsent && (
							<div className="jetpack-comments__options">
								<Toggle
									id="wp-comment-cookies-consent"
									name="wp-comment-cookies-consent"
									value="yes"
									defaultChecked={ hasSavedDetails }
									label={ strings.saveDetails }
								/>
							</div>
						) }
					</div>
				</div>
			</div>
			<Disclosure />
		</div>
	);
};
