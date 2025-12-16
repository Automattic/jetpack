import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import CopyClipboardButton from '../../../components/copy-clipboard-button';
import './style.scss';

const FieldEmail = ( { email } ) => {
	const emailParts = email.split( '@' );

	return (
		<HStack
			alignment="center"
			className="jp-forms__inbox-response-field-email"
			justify="left"
			spacing="2"
		>
			<a href={ `mailto:${ email }` }>
				{ emailParts[ 0 ] }
				<wbr />@{ emailParts[ 1 ] }
			</a>
			<CopyClipboardButton text={ email } />
		</HStack>
	);
};

export default FieldEmail;
