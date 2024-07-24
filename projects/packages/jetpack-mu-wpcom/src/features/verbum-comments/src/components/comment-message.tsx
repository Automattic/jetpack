import clsx from 'clsx';

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
			className={ clsx( 'verbum-message', {
				'is-error': isError,
			} ) }
		>
			<p>{ message }</p>
		</div>
	);
};
