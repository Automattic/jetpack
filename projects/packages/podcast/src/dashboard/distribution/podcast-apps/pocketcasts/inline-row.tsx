import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	Button,
	Notice,
	Tooltip,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { usePodcastSettings } from '../../../hooks/use-podcast-settings';
import './style.scss';
import { extractRejectionReasons, usePocketCastsSubmit } from './use-submit';
import type { PodcastShowState } from '../../../types';
import type { PodcastApp } from '../types';

interface PocketCastsRowProps {
	app: PodcastApp;
	isBlocked: boolean;
	blockedTooltip: string;
	onFirstSave?: () => void;
}

const stateBadgeLabel = ( state: PodcastShowState ): string | null => {
	if ( state === 'active' ) {
		return __( 'Submitted', 'jetpack-podcast' );
	}
	if ( state === 'pending' ) {
		return __( 'Pending', 'jetpack-podcast' );
	}
	return null;
};

const liveStateFromResult = ( state: string ): PodcastShowState | null => {
	if ( state === 'active' || state === 'pending' ) {
		return state;
	}
	return null;
};

const PocketCastsRow = ( { app, isBlocked, blockedTooltip, onFirstSave }: PocketCastsRowProps ) => {
	const { data: settings } = usePodcastSettings();
	const storedState = settings?.podcasting_show_states?.pocketcasts ?? '';

	const isFirstEverActivity = useMemo( () => {
		if ( ! settings ) {
			return false;
		}
		const anyUrl = Object.values( settings.podcasting_show_urls ).some(
			( url ): url is string => !! url
		);
		const anyState = Object.values( settings.podcasting_show_states ).some( s => !! s );
		return ! anyUrl && ! anyState;
	}, [ settings ] );

	const { submit, isSubmitting, result, errorMessage } = usePocketCastsSubmit();
	const celebratedRef = useRef( false );

	const liveState = result ? liveStateFromResult( result.state ) : null;
	const effectiveState: PodcastShowState = liveState ?? storedState;
	const badge = stateBadgeLabel( effectiveState );
	const isDone = effectiveState === 'active';

	const rejectionReasons = useMemo(
		() => ( result?.state === 'rejected' ? extractRejectionReasons( result.pcc ) : [] ),
		[ result ]
	);
	const rejectedMessage = result?.state === 'rejected' ? result.message : null;

	useEffect( () => {
		if ( celebratedRef.current || ! isFirstEverActivity || ! result ) {
			return;
		}
		if ( result.state === 'active' || result.state === 'pending' ) {
			celebratedRef.current = true;
			onFirstSave?.();
		}
	}, [ isFirstEverActivity, result, onFirstSave ] );

	const handleSubmit = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_submit_clicked', {
			directory: app.id,
			prior_state: storedState || 'none',
		} );
		submit();
	}, [ submit, storedState, app.id ] );

	const isButtonDisabled = isBlocked || isSubmitting || isDone;

	return (
		<VStack spacing={ 3 }>
			<HStack alignment="center" justify="space-between" className="podcast__directory-row">
				<HStack alignment="center" spacing={ 4 } expanded={ false }>
					<span aria-hidden="true">
						<app.Logo />
					</span>
					<Text weight={ 500 }>{ app.name }</Text>
					{ badge && <span className="podcast__directory-badge">{ badge }</span> }
				</HStack>
				<Tooltip text={ isBlocked ? blockedTooltip : '' }>
					<Button
						variant="primary"
						onClick={ handleSubmit }
						isBusy={ isSubmitting }
						disabled={ isButtonDisabled }
						accessibleWhenDisabled
						aria-label={
							isBlocked
								? sprintf(
										/* translators: 1: directory name (Pocket Casts). 2: reason the Submit button is disabled. */
										__( 'Submit to %1$s. %2$s', 'jetpack-podcast' ),
										app.name,
										blockedTooltip
								  )
								: undefined
						}
					>
						{ __( 'Submit', 'jetpack-podcast' ) }
					</Button>
				</Tooltip>
			</HStack>

			{ result?.state === 'rejected' && (
				<Notice status="error" isDismissible={ false }>
					{ rejectedMessage ?? __( 'Pocket Casts could not accept this feed.', 'jetpack-podcast' ) }
					{ rejectionReasons.length > 0 && (
						<ul className="podcast__pocketcasts-errors">
							{ rejectionReasons.map( reason => (
								<li key={ reason }>{ reason }</li>
							) ) }
						</ul>
					) }
				</Notice>
			) }

			{ errorMessage && (
				<Notice status="error" isDismissible={ false }>
					{ errorMessage }
				</Notice>
			) }
		</VStack>
	);
};

export default PocketCastsRow;
