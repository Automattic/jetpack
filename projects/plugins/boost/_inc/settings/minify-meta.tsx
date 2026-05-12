import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { CollapsibleCard, Stack } from '@wordpress/ui';
import { z } from 'zod';
import { useDataSyncEntry } from '../lib/use-data-sync-entry';
import './minify-meta.scss';

type Props = {
	/** Data-sync entry key, e.g. `'minify_js_excludes'` or `'minify_css_excludes'`. */
	entryKey: 'minify_js_excludes' | 'minify_css_excludes';
	/** Display label for the asset type (e.g. "JavaScript", "CSS"). Used in copy. */
	assetLabel: string;
	/** Button text — varies by JS vs CSS for translator clarity. */
	buttonText: string;
};

const excludesSchema = z.array( z.string() );
const defaultsSchema = z.array( z.string() );

/**
 * Reusable "Exclude handles" panel rendered inside the Minify JS and
 * Minify CSS module cards. Wraps a `CollapsibleCard` around the
 * comma-separated input, a Save button, and a "Load default
 * handles" link that hydrates the input from the server-side
 * `<entry>_default` read-only entry (the curated list of handles
 * Boost ships).
 *
 * @param props            - See `Props`.
 * @param props.entryKey
 * @param props.assetLabel
 * @param props.buttonText
 * @return The Minify meta panel.
 */
export default function MinifyMeta( { entryKey, assetLabel, buttonText }: Props ): JSX.Element {
	const [ excludesQuery, excludesMutation ] = useDataSyncEntry( entryKey, excludesSchema );
	const defaultsKey = `${ entryKey }_default` as const;
	const [ defaultsQuery ] = useDataSyncEntry( defaultsKey, defaultsSchema, {
		staleTime: 60 * 60 * 1000,
	} );

	const savedHandles = excludesQuery.data ?? [];
	const savedJoined = savedHandles.join( ', ' );
	const [ draft, setDraft ] = useState( '' );

	useEffect( () => {
		setDraft( current => ( current === '' || current === savedJoined ? savedJoined : current ) );
	}, [ savedJoined ] );

	const onSave = () => {
		const handles = draft
			.split( ',' )
			.map( h => h.trim() )
			.filter( Boolean );
		excludesMutation.mutate( handles );
	};

	const onLoadDefaults = () => {
		const defaults = defaultsQuery.data ?? [];
		if ( defaults.length === 0 ) {
			return;
		}
		const next = Array.from( new Set( [ ...savedHandles, ...defaults ] ) );
		excludesMutation.mutate( next );
		setDraft( next.join( ', ' ) );
	};

	const isDirty = draft !== savedJoined;
	const summary =
		savedHandles.length === 0
			? __( 'No exceptions', 'jetpack-boost' )
			: sprintf(
					/* translators: %s is a comma-separated list of asset handles. */
					__( 'Except: %s', 'jetpack-boost' ),
					savedHandles.join( ', ' )
			  );

	return (
		<CollapsibleCard.Root defaultOpen={ false } className="jetpack-boost-minify">
			<CollapsibleCard.Header>
				<div className="jetpack-boost-minify__header">
					<span className="jetpack-boost-minify__heading">{ buttonText }</span>
					<span className="jetpack-boost-minify__summary">{ summary }</span>
				</div>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="md">
					<div>
						<label
							className="jetpack-boost-minify__label"
							htmlFor={ `jetpack-boost-${ entryKey }` }
						>
							<strong>
								{ sprintf(
									/* translators: %s is "JavaScript" or "CSS". */
									__( '%s handles to exclude', 'jetpack-boost' ),
									assetLabel
								) }
							</strong>
						</label>
						<input
							id={ `jetpack-boost-${ entryKey }` }
							className="jetpack-boost-minify__input"
							type="text"
							value={ draft }
							placeholder={ __( 'Comma-separated list of handles to exclude', 'jetpack-boost' ) }
							onChange={ e => setDraft( e.target.value ) }
						/>
						<p className="jetpack-boost-minify__helper">
							{ __( 'Use a comma (,) to separate handles.', 'jetpack-boost' ) }
						</p>
					</div>
					<div className="jetpack-boost-minify__actions">
						<Button
							variant="primary"
							disabled={ ! isDirty || excludesMutation.isPending }
							isBusy={ excludesMutation.isPending }
							onClick={ onSave }
						>
							{ __( 'Save', 'jetpack-boost' ) }
						</Button>
						<Button
							variant="link"
							disabled={ ! defaultsQuery.data || excludesMutation.isPending }
							onClick={ onLoadDefaults }
						>
							{ __( 'Load default handles', 'jetpack-boost' ) }
						</Button>
					</div>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
