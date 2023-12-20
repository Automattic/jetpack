import { CSSTransition } from 'react-transition-group';
import CloseButton from '$features/ui/close-button/close-button';
import styles from './pop-out.module.scss';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, ReactNode } from 'react';
import { DataSyncProvider, useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import { Button } from '@wordpress/components';

type Props = {
	scoreChange: number | false; // Speed score shift to show, or false if none.
	onClose: () => void; // Callback to use when closing the popout.
};

/**
 * Messages which can be shown to the user based on direction of score change.
 */
type ScoreChangeMessage = {
	id: string;
	title: string;
	body: string | ReactNode;
	cta: string;
	ctaLink: string;
};

const fasterMessage = {
	id: 'score-increase',
	title: __( 'Your site got faster', 'jetpack-boost' ),
	body: <p>{ __( `That's great! If you’re happy, why not rate Boost?`, 'jetpack-boost' ) }</p>,
	cta: __( 'Rate the Plugin', 'jetpack-boost' ),
	ctaLink: 'https://wordpress.org/support/plugin/jetpack-boost/reviews/#new-post',
};

const slowerMessage = {
	id: 'score-decrease',
	title: __( 'Speed score has fallen', 'jetpack-boost' ),
	body: (
		<>
			<p>
				{ __(
					'Most of the time Jetpack Boost will increase your site speed, but there may be cases where your score does not increase.',
					'jetpack-boost'
				) }
			</p>
			<p>
				{ __(
					'Try refreshing your score, and if it doesn’t help, check our guide on improving your site speed score:',
					'jetpack-boost'
				) }
			</p>
		</>
	),
	cta: __( 'Read the guide', 'jetpack-boost' ),
	ctaLink: 'https://jetpack.com/support/speed-up-your-site/',
};

/**
 * Wrapper for PopOut which provides a data sync context. Can be removed once we know the
 * parent of PopOut is always wrapped in a DataSyncProvider.
 *
 * @param {Props} props Properties.
 */
export default function PopOut( props: Props ) {
	return (
		<DataSyncProvider>
			<_PopOut { ...props } />
		</DataSyncProvider>
	);
}

/**
 * Helper hook - Use data sync to track which score popouts have been dismissed.
 *
 * @param id - The id of the score popout to track. Accepts null (which will result in dummy return values) for ease of use.
 */
function useDismissedScoreAlerts( id: string | null ): [ boolean, () => void ] {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'dismissed_score_prompt',
		z.array( z.string() )
	);

	// If no id provided, give back a dummy function with "yes, dismissed".
	if ( ! id ) {
		return [ true, () => {} ];
	}

	const isDismissed = data?.includes( id ) || false;
	const dismiss = () => {
		if ( ! isDismissed ) {
			mutate( [ ...( data || [] ), id ] );
		}
	};

	return [ isDismissed, dismiss ];
}

function _PopOut( { scoreChange, onClose }: Props ) {
	const [ message, setMessage ] = useState< ScoreChangeMessage | null >( null );
	const hasScoreChanged = scoreChange !== false && Math.abs( scoreChange ) > 5;

	// Keep the last score change message in state, so we can animate it out after the user dismisses it.
	useEffect( () => {
		if ( hasScoreChanged ) {
			setMessage( scoreChange > 0 ? fasterMessage : slowerMessage );
		}
	}, [ hasScoreChanged, scoreChange ] );

	// Use datasync to track which score alerts have been dismissed.
	const [ isDismissed, dismiss ] = useDismissedScoreAlerts( message?.id );

	// Callback to handle the user dismissing the message by clicking the CTA or the dismiss option
	function handleDismiss() {
		dismiss();
		onClose();
	}

	return (
		<div id="parent" className={ styles.wrapper }>
			<CSSTransition
				in={ hasScoreChanged && ! isDismissed }
				appear={ true }
				classNames={ { ...styles } }
			>
				<div className={ styles.card }>
					<CloseButton onClick={ onClose } />

					<h3 className={ styles.headline }>{ message && message.title }</h3>

					<>{ message && message.body }</>

					<a
						className="jb-button--primary"
						href={ message && message.ctaLink }
						target="_blank"
						rel="noreferrer"
						onClick={ handleDismiss }
					>
						{ message && message.cta }
					</a>

					<Button
						variant="link"
						size="small"
						className={ styles[ 'dismiss-button' ] }
						onClick={ handleDismiss }
					>
						{ __( 'Do not show me again', 'jetpack-boost' ) }
					</Button>
				</div>
			</CSSTransition>
		</div>
	);
}
