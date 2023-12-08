import { useState } from 'react';
import { FixerStatus, usePolling } from '..';
import API from '../lib/api';

type UseFixersSingleParams = {
	threatId: number;
};

type UseFixersMultipleParams = {
	threatIds: Array< number >;
};

type UseFixersParams = UseFixersSingleParams | UseFixersMultipleParams;

type ThreatIdFixStatusMap = {
	[ threatId: number ]: FixerStatus | null;
};

type UseFixersReturn = {
	fix: ( { poll }: { poll: boolean } ) => void;
	fixStatuses: ThreatIdFixStatusMap;
	fetchFixStatuses: () => Promise< ThreatIdFixStatusMap >;
	pollFixStatuses: () => void;
	loading: boolean;
};

const useFixers = ( params: UseFixersParams ): UseFixersReturn => {
	/**
	 * useFixer() supports either a `threatId` or `threatIds` parameter.
	 * `params.threatId` is treated as an alias for `params.threatIds = [ threatId ]`.
	 */
	let _threatIds: Array< number > = [];
	if ( 'threatId' in params ) {
		_threatIds = [ params.threatId ];
	} else if ( 'threatIds' in params ) {
		_threatIds = params.threatIds;
	}

	/** Current fixer status of all threats managed by this hook instance. */
	const [ fixStatuses, setThreatFixStatuses ] = useState< ThreatIdFixStatusMap >(
		_threatIds.reduce( ( prev, curr ) => {
			return {
				...prev,
				[ curr ]: null,
			};
		}, {} )
	);

	const [ loading, setLoading ] = useState< boolean >( false );

	/**
	 * Fetch the latest fixer status for the threats in the hook, and update it in state.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the status is updated.
	 */
	const fetchFixStatuses = async (): Promise< ThreatIdFixStatusMap > => {
		setLoading( true );

		// Fetch the latest fix statuses from the Scan API.
		const apiFixStatusResponse = await API.getFixStatus( _threatIds );

		setLoading( false );

		// Format the response into a map of threatId => fixStatus.
		const threatFixStatuses = Object.keys( apiFixStatusResponse.threats ).reduce(
			( prev, curr ) => {
				return {
					...prev,
					[ curr ]: apiFixStatusResponse.threats[ curr ].status,
				};
			},
			{}
		);

		setThreatFixStatuses( threatFixStatuses );
		return threatFixStatuses;
	};

	const handleCallbackResponse = ( threatFixStatuses: ThreatIdFixStatusMap ) => {
		// Continue polling if any fixers are still in progress.
		return Object.values( threatFixStatuses ).some( status => status === 'in_progress' );
	};

	/**
	 * Poll for the latest fix statuses every 5 seconds until no fixers are in progress.
	 *
	 * @returns {void}
	 */
	const { start: pollFixStatuses, isPolling } = usePolling( {
		callback: fetchFixStatuses,
		handleCallbackResponse,
		interval: 5_000,
	} );

	/**
	 * Attempt to fix all threats managed by the hook instance.
	 *
	 * @param {boolean} poll - Whether to poll for fix statuses after fixing.
	 *
	 * @returns {void} - A promise that resolves when the fix has been enqueued.
	 */
	const fix = ( { poll = false }: { poll: boolean } ): void => {
		API.fixThreats( _threatIds ).then( () => {
			poll && pollFixStatuses();
		} );
	};

	return {
		fix,
		fixStatuses,
		fetchFixStatuses,
		pollFixStatuses,
		loading: loading || isPolling,
	};
};

export default useFixers;
