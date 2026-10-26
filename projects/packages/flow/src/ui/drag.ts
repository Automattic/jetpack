import type { DragPayload } from './types';

const MIME = 'application/x-jetpack-flow';

export function startDrag( event: React.DragEvent, payload: DragPayload ) {
	event.dataTransfer.setData( MIME, JSON.stringify( payload ) );
	event.dataTransfer.effectAllowed = 'copyMove';
}

export function readDrag( event: React.DragEvent ): DragPayload | null {
	try {
		return JSON.parse( event.dataTransfer.getData( MIME ) ) as DragPayload;
	} catch {
		return null;
	}
}

export const hasFlowDrag = ( event: React.DragEvent ) => event.dataTransfer.types.includes( MIME );
