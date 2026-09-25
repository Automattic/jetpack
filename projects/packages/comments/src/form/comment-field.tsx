import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';

export const CommentField = () => {
	const { commentValue, commentParent, isTrayOpen } = useContext( CommentSignals );
	const { strings, maxLength } = JetpackComments;

	return (
		<textarea
			id="comment"
			name="comment"
			className="jetpack-comments__textarea"
			rows={ 2 }
			required
			maxLength={ maxLength }
			aria-label={ commentParent.value ? strings.replyLabel : strings.commentLabel }
			value={ commentValue.value }
			placeholder={ commentParent.value ? strings.replyPlaceholder : strings.placeholder }
			onFocus={ () => ( isTrayOpen.value = true ) }
			onInput={ event => ( commentValue.value = event.currentTarget.value ) }
		/>
	);
};
