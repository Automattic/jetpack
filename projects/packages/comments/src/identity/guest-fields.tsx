import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { EmailIcon, NameIcon, WebsiteIcon } from '../ui/icons';
import { Toggle } from '../ui/toggle';
import type { Commenter } from '../shared/types';

import '../ui/style.scss';
import './style.scss';

type GuestFieldsProps = {
	/** Whether the fields are shown. They leave the DOM when hidden, so nothing is required of them. */
	open?: boolean;
	/** Draw only the fields, for a block that already has its own prompt. */
	bare?: boolean;
};

/**
 * Email, name and website for a reader who is not logged in to this site.
 *
 * These use core's own field names, so wp-comments-post.php reads them unchanged.
 *
 * @param props      - Component props.
 * @param props.open - Whether the fields are shown.
 * @param props.bare - Whether to leave out the prompt and wrapper.
 * @return The guest fields.
 */
export const GuestFields = ( { open = true, bare = false }: GuestFieldsProps ) => {
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

	const fieldset = (
		<div className="jetpack-comments__guest">
			{ fields.map( field => (
				<label key={ field.name } className="jetpack-comments__guest-field" htmlFor={ field.name }>
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
	);

	if ( bare ) {
		return (
			<div className={ clsx( 'jetpack-comments__guest-form', { 'is-open': open } ) }>
				<div>{ open && fieldset }</div>
			</div>
		);
	}

	return (
		<div className="jetpack-comments__identity">
			<p className="jetpack-comments__prompt">
				{ requireNameEmail ? strings.guestPromptRequired : strings.guestPrompt }
			</p>
			{ fieldset }
		</div>
	);
};
