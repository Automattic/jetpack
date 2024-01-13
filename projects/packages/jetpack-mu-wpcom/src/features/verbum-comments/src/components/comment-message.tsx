import { classNames } from '../utils';

interface ErrorMessageProps {
	message: string | null;
	isError?: boolean;
}

export const CommentMessage = ( { message, isError }: ErrorMessageProps ) => {
	if ( ! message ) {
		return null;
	}
	return (
		<div
			className={ classNames( 'verbum-message', {
				'is-error': isError,
			} ) }
		>
			<p>{ message }</p>
		</div>
	);
};
