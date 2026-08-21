import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { EmailIcon, NameIcon, WebsiteIcon } from '../ui/icons';
import { Toggle } from '../ui/toggle';
import type { Commenter } from '../shared/types';

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
	const { requireNameEmail, showCookiesConsent, strings } = JetpackComments;

	const hasSavedDetails = !! JetpackComments.commenter.email;

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
			<div className="jetpack-comments__guest">
				{ fields.map( field => (
					<label
						key={ field.name }
						className="jetpack-comments__guest-field"
						htmlFor={ field.name }
					>
						{ field.icon }
						<input
							id={ field.name }
							name={ field.name }
							type={ field.type }
							autoComplete={ field.autoComplete }
							required={ field.required }
							value={ commenter.value[ field.field ] }
							placeholder={ field.placeholder }
							aria-label={ field.label }
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
	);
};
