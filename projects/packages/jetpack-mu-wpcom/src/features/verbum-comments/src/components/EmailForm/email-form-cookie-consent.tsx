import { useContext, useCallback } from 'preact/hooks';
import { translate } from '../../i18n';
import { VerbumSignals } from '../../state';
import { ToggleControl } from '../ToggleControl';

export const EmailFormCookieConsent = () => {
	const { shouldStoreEmailData } = useContext( VerbumSignals );

	const handleChange = useCallback(
		( e: boolean ) => {
			shouldStoreEmailData.value = e;
		},
		[ shouldStoreEmailData ]
	);

	const label = (
		<div className="verbum-toggle-control__label">
			<p className="primary">
				{ translate(
					'Save my name, email, and website in this browser for the next time I comment.'
				) }
			</p>
		</div>
	);

	return (
		<div className="verbum-mail-form-cookie-consent">
			<ToggleControl
				disabled={ false }
				id="verbum-mail-form-cookie-consent-toggle"
				checked={ shouldStoreEmailData.value }
				label={ label }
				onChange={ handleChange }
			/>
		</div>
	);
};
