import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { readPassport } from '../../identity/passport';
import { CommentSignals } from '../../shared/state';
import { Toggle } from '../../ui/toggle';
import { NO_SUBSCRIPTION, fetchSubscriptions } from './api';
import { FrequencyToggle } from './frequency';
import type { Answer, Frequency, SubscriptionChange } from './types';

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

export const hasSubscriptionOptions = () =>
	JetpackComments.subscriptions.blog || JetpackComments.subscriptions.comments;

export const SubscriptionOptions = () => {
	const { formSettings, subscriptions, signedIn, signInError, activeService, isTrayOpen } =
		useContext( CommentSignals );
	const { subscriptions: settings, user, strings } = JetpackComments;
	const reading = useRef( false );

	const settle = ( answer: Answer ) => {
		if ( ( answer.ok || answer.redeemed ) && signedIn.value?.code ) {
			// The passport is issued now, and its display cookie carries the email.
			signedIn.value = { ...( readPassport() ?? signedIn.value ), code: null };
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
		fetchSubscriptions( formSettings.postId, signedIn.value?.code ?? null ).then( answer => {
			settle( answer );
			subscriptions.value = 'state' in answer ? answer.state : NO_SUBSCRIPTION;
		} );
	}, [ isTrayOpen.value, subscriptions, formSettings, signedIn ] );

	if ( subscriptions.value === null ) {
		return null;
	}

	const state = subscriptions.value ?? NO_SUBSCRIPTION;

	const apply = async ( change: SubscriptionChange ) => {
		const answer = settle(
			await fetchSubscriptions( formSettings.postId, signedIn.value?.code ?? null, change )
		);

		subscriptions.value = answer.state ?? { ...state };
	};

	const offerNotifications =
		settings.blog && ( user ? settings.notifications : signedIn.value?.provider === 'wordpress' );

	return (
		<div className="jetpack-comments__options">
			<Options
				disabled={ subscriptions.value === undefined }
				notifications={
					offerNotifications
						? {
								checked: state.notification.send_posts,
								onChange: value => apply( { notify_posts: value } ),
							}
						: undefined
				}
				posts={
					settings.blog
						? {
								checked: state.email.send_posts,
								frequency: state.email.post_delivery_frequency,
								onChange: value => apply( { email_posts: value } ),
								onFrequency: value => apply( { frequency: value } ),
							}
						: undefined
				}
				comments={
					settings.comments
						? {
								checked: state.email.send_comments,
								onChange: value => apply( { email_comments: value } ),
							}
						: undefined
				}
			/>
		</div>
	);
};

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
			{ comments && <input type="hidden" name="jetpack_comments_email_comments" value="1" /> }
			{ posts && (
				<>
					<input type="hidden" name="jetpack_comments_email_posts" value="1" />
					<input type="hidden" name="jetpack_comments_frequency" value={ frequency } />
				</>
			) }
		</>
	);
};
