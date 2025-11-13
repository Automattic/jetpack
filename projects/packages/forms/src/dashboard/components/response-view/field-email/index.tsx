import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import CopyClipboardButton from '../../../components/copy-clipboard-button';

const FieldEmail = ( { email } ) => {
	return (
		<HStack align="center" spacing="2">
			<a href={ `mailto:${ email }` }>{ email }</a>
			<CopyClipboardButton text={ email } />
		</HStack>
	);
};

export default FieldEmail;
