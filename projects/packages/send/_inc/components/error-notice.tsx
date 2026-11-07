import { Notice } from '@wordpress/ui';

const ErrorNotice = ( { message }: { message: string } ) => (
	<Notice.Root intent="error">
		<Notice.Description>{ message }</Notice.Description>
	</Notice.Root>
);

export default ErrorNotice;
