import { Button, Notice as ComponentsNotice, ProgressBar } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link, Notice, Stack, Text } from '@wordpress/ui';
import {
	useCriticalCssState,
	useRegenerateCriticalCss,
	useRegenerationReason,
	type CriticalCssProvider,
	type RegenerationReason,
} from '../lib/use-critical-css-state';
import './critical-css-status.scss';

type Props = {
	/**
	 * `'manual'` — render the manual-mode card (Critical CSS).
	 * Includes a Regenerate button and surfaces the
	 * regenerate-suggestion banner.
	 *
	 * `'auto'` — render the Cloud CSS card. No regenerate button
	 * (Cloud CSS regenerates server-side); copy reflects the
	 * auto-mode states.
	 */
	mode: 'manual' | 'auto';
};

function formatTimeSince( ts: number | null | undefined ): string {
	if ( ! ts ) {
		return '';
	}
	const seconds = Math.max( 0, Math.floor( Date.now() / 1000 - ts ) );
	if ( seconds < 60 ) {
		return __( 'just now', 'jetpack-boost' );
	}
	const minutes = Math.floor( seconds / 60 );
	if ( minutes < 60 ) {
		return sprintf(
			/* translators: %d minutes ago. */
			_n( '%d minute ago', '%d minutes ago', minutes, 'jetpack-boost' ),
			minutes
		);
	}
	const hours = Math.floor( minutes / 60 );
	if ( hours < 24 ) {
		return sprintf(
			/* translators: %d hours ago. */
			_n( '%d hour ago', '%d hours ago', hours, 'jetpack-boost' ),
			hours
		);
	}
	const days = Math.floor( hours / 24 );
	return sprintf(
		/* translators: %d days ago. */
		_n( '%d day ago', '%d days ago', days, 'jetpack-boost' ),
		days
	);
}

function countSuccessProviders( providers: CriticalCssProvider[] | null | undefined ): number {
	return ( providers ?? [] ).filter( p => p.status === 'success' ).length;
}

function countErrorProviders( providers: CriticalCssProvider[] | null | undefined ): number {
	return ( providers ?? [] ).filter( p => p.status === 'error' || p.status === 'validation-error' )
		.length;
}

function regenerationReasonCopy( reason: RegenerationReason ): string | null {
	switch ( reason ) {
		case 'page_saved':
		case 'post_saved':
			return __(
				'You recently saved a page or post. Regenerate Critical CSS to pick up the changes.',
				'jetpack-boost'
			);
		case 'switched_theme':
			return __(
				'You switched themes. Regenerate Critical CSS so it matches the new theme.',
				'jetpack-boost'
			);
		case 'plugin_change':
			return __(
				'A plugin was activated or deactivated. Regenerate Critical CSS to reflect the change.',
				'jetpack-boost'
			);
		case 'cornerstone_page_saved':
		case 'cornerstone_pages_list_updated':
			return __(
				'Your cornerstone pages changed. Regenerate Critical CSS so the targeted optimizations stay in sync.',
				'jetpack-boost'
			);
		case '1':
			return __( 'Boost suggests regenerating your Critical CSS.', 'jetpack-boost' );
		default:
			return null;
	}
}

/**
 * Status panel for the Critical CSS / Cloud CSS cards.
 *
 * Surfaces what the server is currently doing: a progress indicator
 * while a regeneration is pending (with a determinate ratio when the
 * server reports per-provider progress), the count of successful
 * providers with the timestamp once a generation completes, and a
 * collapsed list of providers that failed. On manual mode it also
 * exposes the regenerate button and surfaces the server-side
 * suggestion banner when a regeneration is recommended.
 *
 * @param props      - See `Props`.
 * @param props.mode - `'manual'` for Critical CSS, `'auto'` for Cloud CSS.
 * @return The status panel element.
 */
export default function CriticalCssStatus( { mode }: Props ): JSX.Element {
	const stateQuery = useCriticalCssState();
	const reasonQuery = useRegenerationReason();
	const regenerate = useRegenerateCriticalCss();

	const state = stateQuery.data;
	const providers = state?.providers ?? [];
	const successCount = countSuccessProviders( providers );
	const errorCount = countErrorProviders( providers );
	const totalCount = providers.length;
	const isPending = state?.status === 'pending';
	const isGenerated = state?.status === 'generated';
	const updatedLabel = formatTimeSince( state?.updated );

	const reasonCopy = mode === 'manual' ? regenerationReasonCopy( reasonQuery.data ?? null ) : null;
	const showRegenerateSuggestion = mode === 'manual' && isGenerated && reasonCopy;

	const onRegenerate = () => regenerate.mutate( undefined as never );

	return (
		<Stack direction="column" gap="md" className="jetpack-boost-css-status">
			{ isPending && (
				<div className="jetpack-boost-css-status__pending">
					<Text variant="body-md">
						{ mode === 'auto' && totalCount === 0
							? __( 'Jetpack will generate your Critical CSS automatically.', 'jetpack-boost' )
							: mode === 'auto'
							? __( 'Generating more Critical CSS…', 'jetpack-boost' )
							: __( "Generating Critical CSS — please don't leave this page.", 'jetpack-boost' ) }
					</Text>
					<ProgressBar
						className="jetpack-boost-css-status__progress"
						value={ totalCount > 0 ? Math.round( ( successCount / totalCount ) * 100 ) : undefined }
					/>
				</div>
			) }

			{ isGenerated && (
				<Text variant="body-md">
					{ updatedLabel
						? createInterpolateElement(
								sprintf(
									/* translators: %1$s is the number of files generated, %2$s is the time since the last generation. */
									_n(
										'<b>%1$s</b> Critical CSS file generated <em>%2$s</em>.',
										'<b>%1$s</b> Critical CSS files generated <em>%2$s</em>.',
										successCount,
										'jetpack-boost'
									),
									String( successCount ),
									updatedLabel
								),
								{ b: <strong />, em: <span className="jetpack-boost-css-status__since" /> }
						  )
						: sprintf(
								/* translators: %d is the number of files generated. */
								_n(
									'%d Critical CSS file generated.',
									'%d Critical CSS files generated.',
									successCount,
									'jetpack-boost'
								),
								successCount
						  ) }
				</Text>
			) }

			{ state?.status === 'error' && (
				<Notice.Root intent="error">
					<Notice.Title>
						{ __( "Critical CSS couldn't be generated", 'jetpack-boost' ) }
					</Notice.Title>
					<Notice.Description>
						{ state.status_error || __( 'Try regenerating to recover.', 'jetpack-boost' ) }
					</Notice.Description>
				</Notice.Root>
			) }

			{ errorCount > 0 && (
				<ComponentsNotice
					status="warning"
					isDismissible={ false }
					className="jetpack-boost-css-status__provider-errors"
				>
					{ sprintf(
						/* translators: %d is the count of providers that hit errors. */
						_n(
							'%d page had errors when generating Critical CSS.',
							'%d pages had errors when generating Critical CSS.',
							errorCount,
							'jetpack-boost'
						),
						errorCount
					) }{ ' ' }
					<Link openInNewTab href={ legacyAdvancedUrl() }>
						{ __( 'See details', 'jetpack-boost' ) }
					</Link>
				</ComponentsNotice>
			) }

			{ showRegenerateSuggestion && (
				<Notice.Root intent="info">
					<Notice.Description>{ reasonCopy }</Notice.Description>
				</Notice.Root>
			) }

			{ mode === 'manual' && (
				<div className="jetpack-boost-css-status__actions">
					<Button
						variant="secondary"
						isBusy={ regenerate.isPending || isPending }
						disabled={ regenerate.isPending || isPending }
						onClick={ onRegenerate }
					>
						{ __( 'Regenerate Critical CSS', 'jetpack-boost' ) }
					</Button>
				</div>
			) }
		</Stack>
	);
}

/**
 * Wp-admin URL of the legacy Critical CSS Advanced page. The
 * modernized chassis hasn't ported the advanced page yet, so for now
 * we deep-link there via the legacy hash route — it works when the
 * modernization filter is off, and PR 4 will wire the route into the
 * new chassis as part of the flag-flip.
 *
 * @return The wp-admin URL pointing at the advanced view.
 */
function legacyAdvancedUrl(): string {
	return 'admin.php?page=jetpack-boost#/critical-css-advanced';
}
