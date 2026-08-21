import { useContext, useEffect, useRef } from 'preact/hooks';
import { CommentSignals } from '../shared/state';

/**
 * Grow the textarea to fit its content.
 *
 * @param textarea - The element to resize.
 */
const resize = ( textarea: HTMLTextAreaElement ) => {
	textarea.style.height = 'auto';
	textarea.style.height = `${ textarea.scrollHeight }px`;
};

export const CommentField = () => {
	const { commentValue, commentParent } = useContext( CommentSignals );
	const { strings, maxLength } = JetpackComments;
	const textarea = useRef< HTMLTextAreaElement >( null );

	useEffect( () => {
		const element = textarea.current;

		if ( ! element ) {
			return;
		}

		resize( element );

		let width = element.clientWidth;
		const observer = new ResizeObserver( () => {
			if ( element.clientWidth !== width ) {
				width = element.clientWidth;
				resize( element );
			}
		} );
		observer.observe( element );

		return () => observer.disconnect();
	}, [ commentValue ] );

	return (
		<textarea
			id="comment"
			name="comment"
			className="jetpack-comments__textarea"
			ref={ textarea }
			required
			maxLength={ maxLength }
			aria-label={ commentParent.value ? strings.replyLabel : strings.commentLabel }
			value={ commentValue.value }
			placeholder={ commentParent.value ? strings.replyPlaceholder : strings.placeholder }
			onInput={ event => {
				resize( event.currentTarget );
				commentValue.value = event.currentTarget.value;
			} }
		/>
	);
};
