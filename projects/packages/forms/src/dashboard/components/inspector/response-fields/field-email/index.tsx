import { Link, Stack } from '@wordpress/ui';
import CopyClipboardButton from '../../../copy-clipboard-button';
import './style.scss';

const FieldEmail = ( { email } ) => {
	const emailParts = email.split( '@' );

	return (
		<Stack
			align="center"
			className="jp-forms__inbox-response-field-email"
			direction="row"
			gap="sm"
			justify="left"
		>
			<Link href={ `mailto:${ email }` }>
				{ emailParts[ 0 ] }
				<wbr />@{ emailParts[ 1 ] }
			</Link>
			<CopyClipboardButton text={ email } />
		</Stack>
	);
};

export default FieldEmail;
