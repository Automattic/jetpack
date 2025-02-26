type EventCallback = ( ...args: unknown[] ) => void;

export class EventEmitter {
	private events: { [ key: string ]: EventCallback[] } = {};

	on( event: string, callback: EventCallback ): void {
		if ( ! this.events[ event ] ) {
			this.events[ event ] = [];
		}
		this.events[ event ].push( callback );
	}

	off( event: string, callback: EventCallback ): void {
		if ( ! this.events[ event ] ) return;
		this.events[ event ] = this.events[ event ].filter( cb => cb !== callback );
	}

	emit( event: string, ...args: unknown[] ): void {
		if ( ! this.events[ event ] ) return;
		this.events[ event ].forEach( callback => callback( ...args ) );
	}
}
