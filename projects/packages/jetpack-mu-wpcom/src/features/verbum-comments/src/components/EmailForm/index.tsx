import { effect, batch, useSignal, useComputed } from '@preact/signals';
import clsx from 'clsx';
import { Suspense, lazy } from 'preact/compat';
import { useState, useEffect, useContext } from 'preact/hooks';
import { translate } from '../../i18n';
import { Name, Website, Email } from '../../images';
import { VerbumSignals } from '../../state';
import { getUserInfoCookie, isAuthRequired } from '../../utils';
import { NewCommentEmail } from '../new-comment-email';
import { NewPostsEmail } from '../new-posts-email';
import { EmailFormCookieConsent } from './email-form-cookie-consent';
import { getProfile } from './profile-get';
import type { ChangeEvent } from 'preact/compat';
import './style.scss';

interface EmailFormProps {
	shouldShowEmailForm: boolean;
}

interface UpdatedFields {
	author?: string;
	url?: string;
}

const ProfileImage = lazy(
	() => import( /* webpackChunkName: './verbum-profile' */ './profile-image' )
);

export const EmailForm = ( { shouldShowEmailForm }: EmailFormProps ) => {
	const { mailLoginData, isMailFormInvalid, shouldStoreEmailData } = useContext( VerbumSignals );

	const isValidEmail = useSignal( true );
	const isEmailTouched = useSignal( false );
	const isNameTouched = useSignal( false );
	const isValidAuthor = useSignal( true );
	const isLoadingProfile = useSignal( false );
	const userProfile = useSignal( null );
	const userEmail = useComputed( () => mailLoginData.value.email || '' );
	const userName = useComputed( () => mailLoginData.value.author || '' );
	const userUrl = useComputed( () => mailLoginData.value.url || '' );

	const blurEmail = async () => {
		// Do we have a valid email?
		if ( ! isValidEmail.value ) {
			userProfile.value = null;
			return;
		}

		// Have we already requested this?
		if ( userEmail.value === userProfile.value?.email ) {
			return;
		}

		// Are we already loading the profile?
		if ( isLoadingProfile.value ) {
			return;
		}

		isLoadingProfile.value = true;

		const profile = await getProfile( userEmail.value );

		isLoadingProfile.value = false;

		if ( profile ) {
			const updatedFields = {} as UpdatedFields;

			// Update the name if it's empty or the same as the current value
			if (
				profile.displayName &&
				( userName.value === '' || userName.value === userProfile.value?.displayName )
			) {
				updatedFields.author = profile.displayName;
			}

			// Update the URL if it's empty or the same as the current value
			if (
				profile.profileUrl &&
				( userUrl.value === '' || userUrl.value === userProfile.value?.profileUrl )
			) {
				updatedFields.url = profile.profileUrl;
			}

			// Perform the form update
			if ( Object.keys( updatedFields ).length > 0 ) {
				mailLoginData.value = {
					...mailLoginData.peek(),
					...updatedFields,
				};
				validateFormData();
			}

			// Update the profile
			userProfile.value = profile;
		} else {
			// Clear the profile on error
			userProfile.value = {
				email: userEmail.value,
			};
		}
	};

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
				loading: isLoadingProfile.value,
				'has-profile': userProfile.value,
			} ) }
		>
			{ shouldShowEmailForm && (
				<div className="verbum-form__wrapper">
					<div className="verbum-form__content">
						<label htmlFor="verbum-email-form-email" className="verbum__label">
							{ userProfile?.value?.emailHash ? (
								<Suspense fallback={ <Email /> }>
									<ProfileImage key={ userProfile.value.email } profile={ userProfile.value } />
								</Suspense>
							) : (
								<Email />
							) }

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
								onBlur={ blurEmail }
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
