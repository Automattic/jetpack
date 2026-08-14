import {
	Button,
	Tooltip,
	VisuallyHidden,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import type { PodcastShowState, PodcatcherId } from '../types';
import type { PodcastApp } from './podcast-apps/types';
import type { ReactNode } from 'react';

// Hoisted so terser can't fold them into __(cond?'a':'b') — the i18n-check
// validator rejects that shape.
const PENDING_LABEL = __( 'Pending', 'jetpack-podcast' );
// `active` means the feed has been crawled by the directory's bot — not that
// the show has actually been published in the directory's catalog. "Submitted"
// reflects what we know; "Live" overpromises.
const SUBMITTED_LABEL = __( 'Submitted', 'jetpack-podcast' );
const SET_UP_LABEL = __( 'Set up', 'jetpack-podcast' );
const VIEW_SHOW_LABEL = __( 'View show', 'jetpack-podcast' );

export const StateBadge = ( { state }: { state: PodcastShowState } ) => {
	if ( state !== 'pending' && state !== 'active' ) {
		return null;
	}
	const label = state === 'active' ? SUBMITTED_LABEL : PENDING_LABEL;
	return (
		<span className={ `podcast__state-badge podcast__state-badge--${ state }` }>
			<VisuallyHidden as="span">{ __( 'Status:', 'jetpack-podcast' ) } </VisuallyHidden>
			{ label }
		</span>
	);
};

interface DirectoryRowProps {
	app: PodcastApp;
	state: PodcastShowState;
	blockedReason: string;
	actionLabel: string;
	// A Tooltip isn't announced, so the reason rides along in the aria-label too.
	blockedActionLabel: string;
	isBusy?: boolean;
	isComplete?: boolean;
	// Live show URL. Turns the action into a link to the show, since once it's
	// live there's nothing left to submit.
	viewUrl?: string;
	onAction: ( id: PodcatcherId ) => void;
	children?: ReactNode;
}

export const DirectoryRow = ( {
	app,
	state,
	blockedReason,
	actionLabel,
	blockedActionLabel,
	isBusy = false,
	isComplete = false,
	viewUrl,
	onAction,
	children,
}: DirectoryRowProps ) => {
	const { Logo } = app;
	const handleClick = useCallback( () => onAction( app.id ), [ onAction, app.id ] );
	return (
		<Stack direction="column" gap="md" render={ <li /> } className="podcast__directory-row">
			<Stack align="center" justify="space-between">
				<Stack align="center" gap="md">
					<span aria-hidden="true">
						<Logo />
					</span>
					<Text weight={ 500 }>{ app.name }</Text>
					<StateBadge state={ state } />
				</Stack>
				{ viewUrl ? (
					<Button
						variant="secondary"
						size="compact"
						icon={ external }
						href={ viewUrl }
						target="_blank"
						rel="noreferrer"
						aria-label={ sprintf(
							/* translators: %s: directory name (Pocket Casts, Apple Podcasts, etc.). */
							__( 'View your show on %s (opens in a new tab)', 'jetpack-podcast' ),
							app.name
						) }
					>
						{ VIEW_SHOW_LABEL }
					</Button>
				) : (
					<Tooltip text={ blockedReason }>
						<Button
							variant="primary"
							size="compact"
							onClick={ handleClick }
							isBusy={ isBusy }
							disabled={ !! blockedReason || isBusy || isComplete }
							accessibleWhenDisabled
							aria-label={ blockedReason ? blockedActionLabel : undefined }
						>
							{ actionLabel }
						</Button>
					</Tooltip>
				) }
			</Stack>
			{ children }
		</Stack>
	);
};

interface DirectoryListProps {
	apps: readonly PodcastApp[];
	states: Partial< Record< PodcatcherId, PodcastShowState > >;
	blockedReason: string;
	onOpenModal: ( id: PodcatcherId ) => void;
	onFirstSave?: () => void;
}

export const DirectoryList = ( {
	apps,
	states,
	blockedReason,
	onOpenModal,
	onFirstSave,
}: DirectoryListProps ) => (
	<Stack direction="column" render={ <ul /> } className="podcast__directory-list">
		{ apps.map( app => {
			const state = states[ app.id ] ?? '';

			if ( app.Row ) {
				const { Row } = app;
				return (
					<Row
						key={ app.id }
						app={ app }
						state={ state }
						blockedReason={ blockedReason }
						onFirstSave={ onFirstSave }
					/>
				);
			}

			return (
				<DirectoryRow
					key={ app.id }
					app={ app }
					state={ state }
					blockedReason={ blockedReason }
					actionLabel={ SET_UP_LABEL }
					blockedActionLabel={
						blockedReason
							? sprintf(
									/* translators: 1: directory name (Apple Podcasts, Spotify, etc.). 2: reason the Set up button is disabled. */
									__( 'Set up %1$s. %2$s', 'jetpack-podcast' ),
									app.name,
									blockedReason
							  )
							: ''
					}
					onAction={ onOpenModal }
				/>
			);
		} ) }
	</Stack>
);
