import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { installAndActivate } from '../api';
import type { Catalog, Flow } from '../types';

type Props = { flow: Flow; catalog: Catalog; onInstalled: () => void };

/** One banner per plugin that the flow's triggers and actions need but the site lacks. */
export function RequirementsNotice( { flow, catalog, onInstalled }: Props ) {
	const [ busy, setBusy ] = useState< string | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	const used = [
		catalog.triggers.find( t => t.id === flow.trigger.type ),
		...flow.steps.map( step => catalog.actions.find( a => a.id === step.type ) ),
	];

	const needs = new Map< string, string[] >();
	for ( const item of used ) {
		if ( item && ! item.available && item.requires ) {
			needs.set( item.requires, [ ...( needs.get( item.requires ) ?? [] ), item.label ] );
		}
	}

	const install = async ( slug: string ) => {
		const plugin = catalog.plugins[ slug ];
		setBusy( slug );
		setError( null );
		try {
			await installAndActivate( slug, plugin.file, plugin.status );
			onInstalled();
		} catch {
			setError(
				sprintf(
					/* translators: %s: plugin name. */ __( 'Could not set up %s.', 'jetpack-flow-pkg' ),
					plugin.name
				)
			);
		} finally {
			setBusy( null );
		}
	};

	return (
		<>
			{ [ ...needs.entries() ].map( ( [ slug, labels ] ) => {
				const plugin = catalog.plugins[ slug ];
				if ( ! plugin ) {
					return null;
				}
				return (
					<Notice.Root key={ slug } intent="warning">
						<Notice.Title>
							{
								/* translators: %s: plugin name. */ sprintf(
									__( '%s is needed', 'jetpack-flow-pkg' ),
									plugin.name
								)
							}
						</Notice.Title>
						<Notice.Description>
							{
								/* translators: %s: list of trigger and action names. */ sprintf(
									__( 'Needed by: %s.', 'jetpack-flow-pkg' ),
									labels.join( ', ' )
								)
							}
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionButton disabled={ busy === slug } onClick={ () => install( slug ) }>
								{ busy === slug
									? __( 'Working…', 'jetpack-flow-pkg' )
									: __( 'Install & activate', 'jetpack-flow-pkg' ) }
							</Notice.ActionButton>
						</Notice.Actions>
					</Notice.Root>
				);
			} ) }
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }
		</>
	);
}
