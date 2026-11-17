import { ClipboardIconButton } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Link, Stack } from '@wordpress/ui';
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
			<ClipboardIconButton
				className="jp-forms__copy-clipboard-button"
				text={ email }
				label={ __( 'Copy', 'jetpack-forms' ) }
				size="small"
			/>
		</Stack>
	);
};

export default FieldEmail;
