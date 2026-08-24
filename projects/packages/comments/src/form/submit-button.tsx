import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';

export const SubmitButton = () => {
	const { formSettings, commentParent, isSavingComment, isSubmitDisabled } =
		useContext( CommentSignals );
	const { strings } = JetpackComments;

	return (
		<button
			id={ formSettings.submitId }
			name={ formSettings.submitName }
			type="submit"
			className={ clsx( 'jetpack-comments__submit', { 'is-busy': isSavingComment.value } ) }
			disabled={ isSubmitDisabled.value }
		>
			{ commentParent.value ? strings.reply : formSettings.submitLabel }
		</button>
	);
};
