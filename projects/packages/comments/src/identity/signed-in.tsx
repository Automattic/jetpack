import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { SubscriptionOptions, hasSubscriptionOptions } from '../subscriptions';
import { CloseIcon } from './checkpoint/icons';
import type { ComponentChildren } from 'preact';

import './style.scss';

type SignedInProps = {
	heading: ComponentChildren;
	children?: ComponentChildren;
};

export const SignedIn = ( { heading, children }: SignedInProps ) => {
	const { isTrayOpen } = useContext( CommentSignals );
	const { strings } = JetpackComments;
	const hasOptions = hasSubscriptionOptions();

	return (
		<div
			className={ clsx( 'jetpack-comments__identity jetpack-comments__identity--signed-in', {
				'is-bare': ! hasOptions,
			} ) }
		>
			<div className="jetpack-comments__signed-in">
				<div className="jetpack-comments__signed-in-heading">
					<div>{ heading }</div>
					<button
						type="button"
						className="jetpack-comments__tray-close"
						disabled={ ! isTrayOpen.value }
						onClick={ () => ( isTrayOpen.value = false ) }
					>
						<span className="jetpack-comments__visually-hidden">{ strings.close }</span>
						<CloseIcon />
					</button>
				</div>
				{ hasOptions && <SubscriptionOptions /> }
			</div>
			{ children }
		</div>
	);
};
