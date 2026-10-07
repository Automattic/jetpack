import { __ } from '@wordpress/i18n';
import { Spinner, Stack, Text } from '@wordpress/ui';
import type { Services } from '../types';
import type { UseQueryResult } from '@tanstack/react-query';
import type { JSX } from 'react';

/**
 * Service names in the given order.
 *
 * @param ids      - Service IDs.
 * @param services - Every service.
 * @return Comma-separated names.
 */
function namesOf( ids: string[], services: Services[ 'services' ] ): string {
	return ids.map( id => services.find( service => service.id === id )?.name ?? id ).join( ', ' );
}

/**
 * The enabled services, read-only until the services manager (CM-968) replaces it.
 *
 * @param props       - Props.
 * @param props.query - The services query.
 * @return List.
 */
export function ServicesList( { query }: { query: UseQueryResult< Services > } ): JSX.Element {
	if ( query.isPending ) {
		return <Spinner />;
	}

	if ( query.isError ) {
		return (
			<Text render={ <p /> }>
				{ __( 'The list of sharing services could not be loaded.', 'jetpack-sharing-likes' ) }
			</Text>
		);
	}

	const { visible, hidden, services } = query.data;

	if ( visible.length === 0 && hidden.length === 0 ) {
		return (
			<Text render={ <p /> }>
				{ __( 'No sharing services are turned on.', 'jetpack-sharing-likes' ) }
			</Text>
		);
	}

	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'Enabled Services', 'jetpack-sharing-likes' ) }
			</Text>
			{ visible.length > 0 && <Text render={ <p /> }>{ namesOf( visible, services ) }</Text> }
			{ hidden.length > 0 && (
				<>
					<Text render={ <p /> }>
						{ __( 'Behind the Share button:', 'jetpack-sharing-likes' ) }
					</Text>
					<Text render={ <p /> }>{ namesOf( hidden, services ) }</Text>
				</>
			) }
		</Stack>
	);
}
