import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';

export const SubmitButton = () => {
	const { commentParent, isSavingComment, isSubmitDisabled } = useContext( CommentSignals );
	const { strings } = JetpackComments;

	return (
		<button
			id="comment-submit"
			name="submit"
			type="submit"
			className={ clsx( 'jetpack-comments__submit', { 'is-busy': isSavingComment.value } ) }
			disabled={ isSubmitDisabled.value }
			aria-disabled={ isSubmitDisabled.value }
		>
			{ commentParent.value ? strings.reply : strings.submit }
		</button>
	);
};
