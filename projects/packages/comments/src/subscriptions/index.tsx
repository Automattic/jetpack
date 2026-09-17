import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { Toggle } from '../ui/toggle';
import { NO_SUBSCRIPTION, changeSubscription, readSubscriptions } from './api';
import { FrequencyToggle } from './frequency';
import type { Answer } from './api';
import type { Frequency, SubscriptionChange } from '../shared/types';

import './style.scss';

type OptionsProps = {
	notifications?: { checked: boolean; onChange: ( on: boolean ) => void };
	posts?: {
		checked: boolean;
		frequency: Frequency;
		onChange: ( on: boolean ) => void;
		onFrequency: ( frequency: Frequency ) => void;
	};
	comments?: { checked: boolean; onChange: ( on: boolean ) => void };
	disabled?: boolean;
};

/**
 * The three options as Verbum laid them out: notifications, new-post emails
 * with their frequency, new-comment emails.
 *
 * @param props               - Component props.
 * @param props.notifications - The web and mobile notifications option, when offered.
 * @param props.posts         - The new-post emails option, when offered.
 * @param props.comments      - The new-comment emails option, when offered.
 * @param props.disabled      - Whether every control is inert.
 * @return The options.
 */
const Options = ( { notifications, posts, comments, disabled }: OptionsProps ) => {
	const { strings } = JetpackComments;
	const { formSettings } = useContext( CommentSignals );
	const id = `jetpack-comments-${ formSettings.postId }`;

	return (
		<>
			{ notifications && (
				<div>
					<Toggle
						id={ `${ id }-notify-posts` }
						checked={ notifications.checked }
						disabled={ disabled }
						onChange={ notifications.onChange }
						label={ strings.notifyNewPosts }
						description={ strings.notifyNewPostsHint }
					/>
				</div>
			) }
			{ posts && (
				<div className="jetpack-comments__posts-option">
					<Toggle
						id={ `${ id }-email-posts` }
						checked={ posts.checked }
						disabled={ disabled }
						onChange={ posts.onChange }
						label={ strings.emailNewPosts }
					/>
					<FrequencyToggle
						name={ `${ id }-frequency` }
						value={ posts.frequency }
						disabled={ ! posts.checked || disabled }
						onChange={ posts.onFrequency }
					/>
				</div>
			) }
			{ comments && (
				<div>
					<Toggle
						id={ `${ id }-email-comments` }
						checked={ comments.checked }
						disabled={ disabled }
						onChange={ comments.onChange }
						label={ strings.emailNewComments }
					/>
				</div>
			) }
		</>
	);
};

/**
 * Whether the site offers anything to subscribe to from the form.
 *
 * @return Whether either option is on.
 */
export const hasSubscriptionOptions = () =>
	JetpackComments.subscriptions.blog || JetpackComments.subscriptions.comments;

/**
 * The options for a signed-in reader. Each change is saved as it is made, and
 * the state is read the first time the tray opens.
 *
 * @return The options, or nothing while the site has no email for the reader.
 */
export const SubscriptionOptions = () => {
	const { formSettings, subscriptions, signedIn, signInError, activeService, isTrayOpen } =
		useContext( CommentSignals );
	const { subscriptions: settings, user, strings } = JetpackComments;
	const reading = useRef( false );

	// A fresh sign-in's code is redeemed by the first request, and the passport stands for it after.
	const settle = ( answer: Answer ) => {
		if ( answer.passport && signedIn.value ) {
			signedIn.value = { ...signedIn.value, code: null };
		}

		if ( answer.signedOut && signedIn.value ) {
			signedIn.value = null;
			activeService.value = '';
			signInError.value = strings.signInFailed;
		}

		return answer;
	};

	useEffect( () => {
		if ( ! isTrayOpen.value || subscriptions.value !== undefined || reading.current ) {
			return;
		}

		reading.current = true;
		readSubscriptions( formSettings.postId, signedIn.value?.code ?? null ).then( answer => {
			settle( answer );
			// A failure reads as no subscription, as it did in Verbum.
			subscriptions.value = 'state' in answer ? answer.state : NO_SUBSCRIPTION;
		} );
	}, [ isTrayOpen.value, subscriptions, formSettings, signedIn ] );

	if ( subscriptions.value === null ) {
		return null;
	}

	const state = subscriptions.value ?? NO_SUBSCRIPTION;
	const isLoading = subscriptions.value === undefined;

	const apply = async ( change: SubscriptionChange ) => {
		const answer = settle(
			await changeSubscription( formSettings.postId, change, signedIn.value?.code ?? null )
		);

		// A declined change still re-renders, so the control snaps back to the state.
		subscriptions.value = answer.state ?? { ...state };
	};

	// Notifications reach a WordPress.com account: one the site logs in as, or one that signed in through the popup.
	const offerNotifications =
		settings.blog && ( user ? settings.notifications : signedIn.value?.provider === 'wordpress' );

	return (
		<div className="jetpack-comments__options">
			<Options
				disabled={ isLoading }
				notifications={
					offerNotifications
						? {
								checked: state.notification.send_posts,
								onChange: value => apply( { field: 'notify_posts', value } ),
						  }
						: undefined
				}
				posts={
					settings.blog
						? {
								checked: state.email.send_posts,
								frequency: state.email.post_delivery_frequency,
								onChange: value => apply( { field: 'email_posts', value } ),
								onFrequency: value => apply( { field: 'frequency', value } ),
						  }
						: undefined
				}
				comments={
					settings.comments
						? {
								checked: state.email.send_comments,
								onChange: value => apply( { field: 'email_comments', value } ),
						  }
						: undefined
				}
			/>
		</div>
	);
};

/**
 * The options for a guest, who has no account to save against. They post with
 * the comment, in the fields each host's subscription handler already reads.
 *
 * @return The options and their hidden fields.
 */
export const GuestSubscriptionOptions = () => {
	const { subscriptions: settings } = JetpackComments;
	const [ posts, setPosts ] = useState( false );
	const [ frequency, setFrequency ] = useState< Frequency >( 'instantly' );
	const [ comments, setComments ] = useState( false );

	return (
		<>
			<Options
				posts={
					settings.blog
						? { checked: posts, frequency, onChange: setPosts, onFrequency: setFrequency }
						: undefined
				}
				comments={ settings.comments ? { checked: comments, onChange: setComments } : undefined }
			/>
			{ /* Simple reads `subscribe`, the Jetpack plugin `subscribe_comments`. */ }
			{ comments && <input type="hidden" name="subscribe" value="subscribe" /> }
			{ comments && <input type="hidden" name="subscribe_comments" value="subscribe" /> }
			{ posts && (
				<>
					<input type="hidden" name="subscribe_blog" value="subscribe" />
					<input type="hidden" name="delivery_frequency" value={ frequency } />
					<input type="hidden" name="sub-type" value="jetpack-comments-toggle" />
				</>
			) }
		</>
	);
};
