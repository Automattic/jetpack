import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import type { DetailsFieldsProps } from './types';

/**
 * Name, email and website, and whether to save them.
 *
 * @param props            - Component props.
 * @param props.emailTaken - Whether the email belongs to a WordPress.com account.
 * @param props.introId    - The intro describing the fields, read with the first one.
 * @param props.logIn      - The sign-in the taken-email notice points to.
 * @return The fields and the save switch.
 */
export const DetailsFields = ( { emailTaken, introId, logIn }: DetailsFieldsProps ) => {
	const { details, rememberDetails } = useContext( CommentSignals );
	const { strings, requireNameEmail } = JetpackComments;
	const fields = [
		{
			field: 'author' as const,
			type: 'text',
			autoComplete: 'name',
			label: strings.name,
			describedBy: introId,
		},
		{
			field: 'email' as const,
			type: 'email',
			autoComplete: 'email',
			label: strings.email,
			describedBy: 'email-notes',
		},
		// Text, like Verbum and unlike core's type="url", so a bare domain passes. Core adds the protocol on save.
		{
			field: 'url' as const,
			type: 'text',
			autoComplete: 'url',
			label: strings.website,
			maxLength: 200,
		},
	];

	return (
		<>
			{ fields.map( ( { field, ...input } ) => (
				<div key={ field } className="jetpack-comments__field">
					<label htmlFor={ field } className="jetpack-comments__label">
						{ input.label }
					</label>
					<input
						id={ field }
						name={ field }
						type={ input.type }
						autoComplete={ input.autoComplete }
						maxLength={ input.maxLength }
						spellcheck={ field === 'url' ? false : undefined }
						autoCorrect={ field === 'url' ? 'off' : undefined }
						className="jetpack-comments__input"
						aria-describedby={ input.describedBy }
						aria-invalid={ field === 'email' && emailTaken ? 'true' : undefined }
						required={ requireNameEmail && field !== 'url' }
						value={ details.value[ field ] }
						onInput={ event => {
							details.value = { ...details.value, [ field ]: event.currentTarget.value };
						} }
					/>
					{ field === 'email' && (
						<span id="email-notes" className="jetpack-comments__help">
							{ strings.emailHint }
						</span>
					) }
					{ field === 'email' && emailTaken && (
						<>
							<span className="jetpack-comments__notice" role="alert">
								{ strings.emailHasAccount }
							</span>
							{ logIn }
						</>
					) }
				</div>
			) ) }
			<label htmlFor="remember" className="jetpack-comments__toggle">
				<input
					id="remember"
					type="checkbox"
					role="switch"
					checked={ rememberDetails.value }
					onChange={ event => ( rememberDetails.value = event.currentTarget.checked ) }
				/>
				{ strings.saveDetails }
			</label>
		</>
	);
};
