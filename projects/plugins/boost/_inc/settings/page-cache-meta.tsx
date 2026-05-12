import { Button, ToggleControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CollapsibleCard, Notice, Stack } from '@wordpress/ui';
import {
	useClearPageCache,
	usePageCacheError,
	usePageCacheSettings,
	useRunPageCacheSetup,
} from '../lib/use-page-cache';
import './page-cache-meta.scss';

/**
 * Legacy hash-route to the cache debug log sub-page. The advanced
 * sub-page hasn't been ported to the new chassis yet — PR 4 will wire
 * it in as part of the flag-flip. Link is kept here so the user can
 * still reach the logs by toggling the modernization filter off.
 */
const CACHE_DEBUG_LOG_URL = 'admin.php?page=jetpack-boost#/cache-debug-log';

/**
 * Advanced controls for the Page Cache module. Surfaces the bypass-
 * patterns regex list, the logging toggle (paired with a deep link to
 * the cache debug log), a "Clear cache" action, and a soft notice
 * when the cache engine reports a setup error. Wrapped in a
 * `CollapsibleCard` so it doesn't dominate the Settings list when the
 * cache is humming along.
 *
 * Server-side requirement checks (permalinks, wp-content writable,
 * `WP_CACHE` constant, /boost-cache writable) are surfaced via the
 * `page_cache_error` notice — the legacy hosting-detection notices
 * (WoA / WP.com / conflicting plugin) are deferred to a follow-up so
 * this PR doesn't drag in the legacy `hosting` utilities.
 *
 * @return The Page Cache meta panel.
 */
export default function PageCacheMeta(): JSX.Element {
	const [ settingsQuery, settingsMutation ] = usePageCacheSettings();
	const [ errorQuery, errorMutation ] = usePageCacheError();
	const setupAction = useRunPageCacheSetup();
	const clearAction = useClearPageCache();

	const saved = settingsQuery.data;
	const error = errorQuery.data;

	const [ draftPatterns, setDraftPatterns ] = useState( '' );

	const savedJoined = ( saved?.bypass_patterns ?? [] ).join( '\n' );
	useEffect( () => {
		setDraftPatterns( current =>
			current === '' || current === savedJoined ? savedJoined : current
		);
	}, [ savedJoined ] );

	const onSavePatterns = () => {
		if ( ! saved ) {
			return;
		}
		const next = draftPatterns
			.split( '\n' )
			.map( line => line.trim() )
			.filter( Boolean );
		settingsMutation.mutate( { ...saved, bypass_patterns: next } );
	};

	const onToggleLogging = () => {
		if ( ! saved ) {
			return;
		}
		settingsMutation.mutate( { ...saved, logging: ! saved.logging } );
	};

	const onClearCache = () => {
		clearAction.mutate( undefined as never );
	};

	const onRetrySetup = () => {
		setupAction.mutate( undefined as never );
	};

	const onDismissError = () => {
		if ( error ) {
			errorMutation.mutate( { ...error, dismissed: true } );
		}
	};

	const dirty = draftPatterns !== savedJoined;
	const showError = !! error && ! error.dismissed;

	return (
		<Stack direction="column" gap="md" className="jetpack-boost-page-cache">
			{ showError && error && (
				<Notice.Root intent="error">
					<Notice.Title>{ __( 'Page Cache setup error', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>{ error.message }</Notice.Description>
					<Notice.Actions>
						<Button
							variant="secondary"
							isBusy={ setupAction.isPending }
							disabled={ setupAction.isPending }
							onClick={ onRetrySetup }
						>
							{ __( 'Retry setup', 'jetpack-boost' ) }
						</Button>
						<Button variant="tertiary" onClick={ onDismissError }>
							{ __( 'Dismiss', 'jetpack-boost' ) }
						</Button>
					</Notice.Actions>
				</Notice.Root>
			) }

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>{ __( 'Show options', 'jetpack-boost' ) }</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="md">
						<div>
							<label
								className="jetpack-boost-page-cache__label"
								htmlFor="jetpack-boost-page-cache-patterns"
							>
								<strong>{ __( 'Bypass patterns', 'jetpack-boost' ) }</strong>
							</label>
							<textarea
								id="jetpack-boost-page-cache-patterns"
								className="jetpack-boost-page-cache__textarea"
								rows={ 4 }
								value={ draftPatterns }
								onChange={ e => setDraftPatterns( e.target.value ) }
								placeholder={ __( 'One regex pattern per line', 'jetpack-boost' ) }
							/>
							<p className="jetpack-boost-page-cache__helper">
								{ __(
									'Pages matching any of these patterns will skip the cache.',
									'jetpack-boost'
								) }
							</p>
							<Button
								variant="primary"
								disabled={ ! dirty || settingsMutation.isPending }
								isBusy={ settingsMutation.isPending }
								onClick={ onSavePatterns }
							>
								{ __( 'Save patterns', 'jetpack-boost' ) }
							</Button>
						</div>

						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Log page cache hits and misses', 'jetpack-boost' ) }
							help={ __(
								'Keep a running log of cache behavior — useful for debugging slow pages.',
								'jetpack-boost'
							) }
							checked={ saved?.logging ?? false }
							disabled={ ! saved || settingsMutation.isPending }
							onChange={ onToggleLogging }
						/>

						<div className="jetpack-boost-page-cache__actions">
							<Button variant="link" href={ CACHE_DEBUG_LOG_URL }>
								{ __( 'See logs', 'jetpack-boost' ) }
							</Button>
							<Button
								variant="secondary"
								isBusy={ clearAction.isPending }
								disabled={ clearAction.isPending }
								onClick={ onClearCache }
							>
								{ __( 'Clear cache', 'jetpack-boost' ) }
							</Button>
						</div>
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</Stack>
	);
}
