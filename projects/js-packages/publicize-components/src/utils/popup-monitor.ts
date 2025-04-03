export class PopupMonitor {
	private popup: Window | null = null;
	private channel: BroadcastChannel;

	constructor() {
		this.channel = new BroadcastChannel( 'jetpack_publicize' );
	}

	getScreenCenterSpecs( width: number, height: number ) {
		const screenTop = typeof window.screenTop !== 'undefined' ? window.screenTop : window.screenY;
		const screenLeft =
			typeof window.screenLeft !== 'undefined' ? window.screenLeft : window.screenX;
		return [
			'width=' + width,
			'height=' + height,
			'top=' + ( screenTop + window.innerHeight / 2 - height / 2 ),
			'left=' + ( screenLeft + window.innerWidth / 2 - width / 2 ),
		].join();
	}

	public async start< T >(
		url: string | URL,
		target?: string | null,
		features?: string
	): Promise< T > {
		console.log( 'origin', window.origin );

		return new Promise( ( resolve, reject ) => {
			this.popup = window.open( url, target, features );

			if ( ! this.popup ) {
				reject( new Error( 'Popup blocked or failed to open.' ) );
				return;
			}

			console.log( '[Parent] Opened popup:', url );

			this.channel.addEventListener( 'message', ( event: MessageEvent ) => {
				console.log( '[Parent] Received message:', event.data );

				if ( event.data.type === 'keyring-result' ) {
					this.cleanup();
					resolve( event.data.payload );
				}
			} );

			window.addEventListener( 'message', ( event: MessageEvent ) => {
				console.log( '[Parent] Received message from popup window:', event );
			} );
		} );
	}

	private cleanup(): void {
		console.log( '[Parent] Cleaning up and closing channel.' );
		this.channel.close();
		this.popup = null;
	}
}
