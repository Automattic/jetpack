import { JetpackFooter } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import JetpackFormsLogo from '../components/logo';

const Inbox = () => {
	return (
		<div>
			<div className="jp-forms__header">
				<JetpackFormsLogo />
				<h2 className="jp-forms__header-text">{ __( 'Form Responses', 'jetpack-forms' ) }</h2>
			</div>

			<JetpackFooter
				className="jp-forms__footer"
				moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
			/>
		</div>
	);
};

export default Inbox;
