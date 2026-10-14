import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { Identity } from './identity';

import './style.scss';

const utf8 = new TextEncoder();

/**
 * The row under the comment: the too-long notice, the submit, and who is commenting.
 *
 * @return The footer.
 */
export const Footer = () => {
	const { formSettings, commentParent, commentValue, isEmptyComment, isPosting, commenter } =
		useContext( CommentSignals );
	const { mustLogIn, identity, strings, maxLength } = JetpackComments;
	const { submit } = formSettings;
	// The textarea's maxLength holds back typing, not the editor. Counted as PHP counts, in UTF-8 bytes.
	const isTooLong = utf8.encode( commentValue.value ).length > maxLength;

	return (
		<div className="jetpack-comments__actions">
			{ isTooLong && (
				<p className="jetpack-comments__too-long" role="alert">
					{ strings.tooLong }
				</p>
			) }
			<span className={ clsx( 'jetpack-comments__submit', submit.wrapClass ) }>
				<input
					id={ submit.id }
					name={ submit.name }
					type="submit"
					className={ clsx( submit.class, { 'is-busy': isPosting.value } ) }
					disabled={
						( mustLogIn && commenter.value.kind === 'unknown' && ! identity.canSignIn ) ||
						isEmptyComment.value ||
						isTooLong
					}
					aria-disabled={ isPosting.value || undefined }
					value={ commentParent.value ? strings.reply : submit.label }
				/>
			</span>
			<Identity />
		</div>
	);
};
