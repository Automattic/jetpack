import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Notice, Text } from '@wordpress/ui';
import { installAndActivate } from '../api';
import type { Catalog, Flow } from '../types';

type Props = { flow: Flow; catalog: Catalog; onInstalled: () => void };

/** A friendly prompt to set up the first plugin the flow needs but the site lacks. */
export function RequirementsNotice( { flow, catalog, onInstalled }: Props ) {
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ skipped, setSkipped ] = useState< string[] >( [] );

	const used = [
		...flow.triggers.map( id => catalog.triggers.find( t => t.id === id ) ),
		...flow.steps.map( step => catalog.actions.find( a => a.id === step.type ) ),
	];

	const needs = new Map< string, string[] >();
	for ( const item of used ) {
		if ( item && ! item.available && item.requires ) {
			needs.set( item.requires, [ ...( needs.get( item.requires ) ?? [] ), item.label ] );
		}
	}

	const slug = [ ...needs.keys() ].find(
		key => catalog.plugins[ key ] && ! skipped.includes( key )
	);
	const plugin = slug ? catalog.plugins[ slug ] : undefined;

	const install = async () => {
		if ( ! slug || ! plugin ) {
			return;
		}
		setBusy( true );
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
			setBusy( false );
		}
	};

	const skip = () => {
		if ( slug && ! busy ) {
			setError( null );
			setSkipped( [ ...skipped, slug ] );
		}
	};

	const installed = plugin?.status === 'inactive';
	let actionLabel: string = __( 'Install & activate now', 'jetpack-flow-pkg' );
	if ( busy ) {
		actionLabel = __( 'Working…', 'jetpack-flow-pkg' );
	} else if ( installed ) {
		actionLabel = __( 'Activate now', 'jetpack-flow-pkg' );
	}

	return (
		<Dialog.Root open={ !! plugin } onOpenChange={ open => ! open && skip() }>
			<Dialog.Popup size="small">
				<Dialog.Header>
					<Dialog.Title>
						{ plugin &&
							( installed
								? /* translators: %s: plugin name. */ sprintf(
										__( 'Turn on %s to use this', 'jetpack-flow-pkg' ),
										plugin.name
									)
								: /* translators: %s: plugin name. */ sprintf(
										__( 'Add %s to use this', 'jetpack-flow-pkg' ),
										plugin.name
									) ) }
					</Dialog.Title>
				</Dialog.Header>
				<Dialog.Content>
					<Text>
						{ plugin &&
							slug &&
							/* translators: 1: list of trigger and action names, 2: plugin name. */ sprintf(
								__( '%1$s works with %2$s. It only takes a moment.', 'jetpack-flow-pkg' ),
								( needs.get( slug ) ?? [] ).join( ', ' ),
								plugin.name
							) }
					</Text>
					{ error && (
						<Notice.Root intent="error">
							<Notice.Description>{ error }</Notice.Description>
						</Notice.Root>
					) }
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="minimal" tone="neutral" disabled={ busy } onClick={ skip }>
						{ __( 'Skip for now', 'jetpack-flow-pkg' ) }
					</Button>
					<Button disabled={ busy } onClick={ install }>
						{ actionLabel }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
