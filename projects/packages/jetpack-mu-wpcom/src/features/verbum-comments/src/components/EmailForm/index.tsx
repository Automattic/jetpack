import { effect, batch, useSignal, useComputed } from '@preact/signals';
import clsx from 'clsx';
import { useState, useEffect, useContext } from 'preact/hooks';
import { translate } from '../../i18n';
import { Name, Website, Email } from '../../images';
import { VerbumSignals } from '../../state';
import { getUserInfoCookie, isAuthRequired } from '../../utils';
import { NewCommentEmail } from '../new-comment-email';
import { NewPostsEmail } from '../new-posts-email';
import { EmailFormCookieConsent } from './email-form-cookie-consent';
import type { ChangeEvent } from 'preact/compat';
import './style.scss';

interface EmailFormProps {
	shouldShowEmailForm: boolean;
}

export const EmailForm = ( { shouldShowEmailForm }: EmailFormProps ) => {
	const { mailLoginData, isMailFormInvalid, shouldStoreEmailData } = useContext( VerbumSignals );

	const isValidEmail = useSignal( true );
	const isEmailTouched = useSignal( false );
	const isNameTouched = useSignal( false );
	const isValidAuthor = useSignal( true );
	const userEmail = useComputed( () => mailLoginData.value.email || '' );
	const userName = useComputed( () => mailLoginData.value.author || '' );
	const userUrl = useComputed( () => mailLoginData.value.url || '' );

	const validateFormData = () => {
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		batch( () => {
			isValidEmail.value =
				Boolean( userEmail.value ) && Boolean( emailRegex.test( userEmail.value ) );
			isValidAuthor.value = Boolean( userName.value.length > 0 );
		} );
	};

	const setFormData = ( event: ChangeEvent< HTMLInputElement > ) => {
		mailLoginData.value = {
			...mailLoginData.peek(),
			[ event.currentTarget.name ]: event.currentTarget.value,
		};
		validateFormData();
	};

	const { subscribeToComment, subscribeToBlog } = VerbumComments;
	const [ emailNewComment, setEmailNewComment ] = useState( false );
	const [ emailNewPosts, setEmailNewPosts ] = useState( false );
	const [ deliveryFrequency, setDeliveryFrequency ] = useState( 'instantly' );
	const authRequired = isAuthRequired();
	const dispose = effect( () => {
		const isValid = authRequired && isValidEmail.value && isValidAuthor.value;
		isMailFormInvalid.value = ! isValid;
	} );

	useEffect( () => {
		const userCookie = getUserInfoCookie();

		if ( userCookie?.service === 'guest' ) {
			mailLoginData.value = {
				...( userCookie?.email && { email: userCookie?.email } ),
				...( userCookie?.author && {
					author: userCookie?.author,
				} ),
				...( userCookie?.url && { url: userCookie?.url } ),
			};

			if ( userCookie?.email ) {
				validateFormData();
				shouldStoreEmailData.value = true;
			}
		}

		return () => {
			dispose();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<div
			className={ clsx( 'verbum-form', {
				open: shouldShowEmailForm,
			} ) }
		>
			{ shouldShowEmailForm && (
				<div className="verbum-form__wrapper">
					<div className="verbum-form__content">
						<label htmlFor="verbum-email-form-email" className="verbum__label">
							<Email />
							<input
								id="verbum-email-form-email"
								className={ clsx( 'verbum-form__email', {
									'invalid-form-data': isValidEmail.value === false && isEmailTouched.value,
								} ) }
								type="email"
								spellCheck={ false }
								autoCorrect="off"
								autoComplete="email"
								required={ authRequired }
								onInput={ event => {
									isEmailTouched.value = true;
									setFormData( event );
								} }
								value={ userEmail }
								name="email"
								placeholder={ `${ translate( 'Email' ) } ${ translate(
									'(Address never made public)'
								) }` }
							/>
						</label>

						<label htmlFor="verbum-email-form-name" className="verbum__label">
							<Name />
							<input
								id="verbum-email-form-name"
								className={ clsx( 'verbum-form__name', {
									'invalid-form-data': isValidAuthor.value === false && isNameTouched.value,
								} ) }
								type="text"
								spellCheck={ false }
								autoCorrect="off"
								autoComplete="name"
								required={ authRequired }
								onInput={ event => {
									isNameTouched.value = true;
									setFormData( event );
								} }
								value={ userName }
								name="author"
								placeholder={ translate( 'Name' ) }
							/>
						</label>

						<label htmlFor="verbum-email-form-website" className="verbum__label">
							<Website />
							<input
								id="verbum-email-form-website"
								className="verbum-form__website"
								type="text"
								spellCheck={ false }
								autoCorrect="off"
								name="url"
								onInput={ setFormData }
								value={ userUrl }
								placeholder={ `${ translate( 'Website' ) } (${ translate( 'Optional' ) })` }
							/>
						</label>
						{ ( subscribeToComment || subscribeToBlog ) && (
							<div className="verbum-form__subscriptions verbum-subscriptions__options">
								{ subscribeToBlog && (
									<NewPostsEmail
										handleOnChange={ change => {
											if ( change.type === 'frequency' ) {
												setDeliveryFrequency( change.value );
											} else if ( change.type === 'subscribe' ) {
												setEmailNewPosts( change.value );
											}
										} }
										isChecked={ emailNewPosts }
										selectedOption={ deliveryFrequency }
									/>
								) }
								{ subscribeToComment && (
									<NewCommentEmail
										handleOnChange={ () => setEmailNewComment( ! emailNewComment ) }
										isChecked={ emailNewComment }
										disabled={ false }
									/>
								) }
							</div>
						) }
						<EmailFormCookieConsent />
						<div className="verbum-user__submit__identity">
							<input type="hidden" name="hc_post_as" value="guest" />
							{ emailNewComment && <input type="hidden" name="subscribe" value="subscribe" /> }
							{ emailNewPosts && (
								<>
									<input type="hidden" name="subscribe_blog" value="subscribe" />
									<input type="hidden" name="delivery_frequency" value={ deliveryFrequency } />
									<input type="hidden" name="sub-type" value="verbum-subscription-toggle" />
								</>
							) }
							{ shouldStoreEmailData.value && (
								<input type="hidden" name="wp-comment-cookies-consent" value="1" />
							) }
						</div>
					</div>
				</div>
			) }
		</div>
	);
};
