import { translate } from '../../i18n';
import type { ChangeEvent } from 'preact/compat';

interface SubscriptionModalProps {
	userEmail: string;
	subscribeState: string;
	handleOnSubscribeClick: () => void;
	onInput?: ( event: ChangeEvent< HTMLInputElement > ) => void;
	disabled?: boolean;
	subscribeDisabled?: boolean;
}

export const SubscriptionModal = ( {
	userEmail,
	handleOnSubscribeClick,
	subscribeState,
	onInput,
	disabled,
	subscribeDisabled,
}: SubscriptionModalProps ) => {
	return (
		<>
			<h2>{ translate( 'Never miss a beat!' ) }</h2>
			<p>
				{ translate(
					'Interested in getting blog post updates? Simply click the button below to stay in the loop!'
				) }
			</p>
			<div className="verbum-simple-subscribe-modal__action">
				<input
					className="verbum-verbum-simple-subscribe-modal__action-input"
					type="email"
					autoComplete="email"
					spellCheck={ false }
					autoCorrect="off"
					name="subscription-email"
					placeholder={ translate( 'Enter your email address' ) }
					value={ userEmail }
					disabled={ disabled }
					onInput={ event => {
						if ( onInput ) {
							onInput( event );
						}
					} }
				/>
				<button
					className="verbum-verbum-simple-subscribe-modal__action-button"
					name="submit"
					type="button"
					id="subscribe-submit"
					onClick={ handleOnSubscribeClick }
					disabled={ subscribeDisabled || subscribeState === 'SUBSCRIBING' }
				>
					{ translate( 'Subscribe' ) }
				</button>
			</div>
		</>
	);
};

export default SubscriptionModal;
