import { translate } from '../../i18n';
import { ToggleControl } from '../ToggleControl';
import { shouldStoreEmailData } from '../../state';

export const EmailFormCookieConsent = () => {
	return (
		<div className="verbum-mail-form-cookie-consent">
			<ToggleControl
				disabled={ false }
				id="verbum-mail-form-cookie-consent-toggle"
				checked={ shouldStoreEmailData.value }
				label={ translate(
					'Save my name, email, and website in this browser for the next time I comment.'
				) }
				onChange={ ( e: boolean ) => {
					shouldStoreEmailData.value = e;
				} }
			/>
		</div>
	);
};
