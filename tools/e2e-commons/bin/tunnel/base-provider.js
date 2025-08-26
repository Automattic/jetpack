/**
 * Base class for tunnel providers
 * Defines the interface that all tunnel providers must implement
 */
export default class BaseTunnelProvider {
	constructor( manager ) {
		this.manager = manager;
	}

	/**
	 * Start the tunnel
	 * Must be implemented by subclasses
	 * @return {Promise<void>}
	 */
	async start() {
		throw new Error( 'start() method must be implemented by subclass' );
	}

	/**
	 * Stop the tunnel
	 * Must be implemented by subclasses
	 * @return {Promise<void>}
	 */
	async stop() {
		throw new Error( 'stop() method must be implemented by subclass' );
	}
}
