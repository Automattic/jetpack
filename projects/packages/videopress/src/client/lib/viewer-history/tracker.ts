/**
 * Turns player time updates into played segments. A jump of more than MAX_STEP_MS
 * ( a seek, or time spent paused ) closes the segment, so seeking to the end plays nothing.
 */
export const MAX_STEP_MS = 2500;

export type Segment = [ number, number ];

export class PlayTracker {
	private playing = false;
	private segmentStart: number | null = null;
	private last: number | null = null;
	private done: Segment[] = [];
	positionMs = 0;
	durationMs = 0;

	play(): void {
		this.playing = true;
	}

	/**
	 * Stop extending the current segment ( pause, seeking, ended ).
	 */
	stop(): void {
		this.close();
		this.playing = false;
	}

	duration( ms: number ): void {
		if ( ms > 0 ) {
			this.durationMs = Math.round( ms );
		}
	}

	time( ms: number ): void {
		const now = Math.max( 0, Math.round( ms ) );
		this.positionMs = now;
		if ( ! this.playing ) {
			this.last = now;
			return;
		}
		if ( this.last === null || now < this.last || now - this.last > MAX_STEP_MS ) {
			this.close();
			this.segmentStart = now;
		}
		this.last = now;
	}

	private close(): void {
		if ( this.segmentStart !== null && this.last !== null && this.last > this.segmentStart ) {
			this.done.push( [ this.segmentStart, this.last ] );
		}
		this.segmentStart = this.playing && this.last !== null ? this.last : null;
	}

	/**
	 * Segments played since the last take, the open one included up to now.
	 *
	 * @return Segments as [start, end] milliseconds.
	 */
	take(): Segment[] {
		const open = this.segmentStart;
		this.close();
		const segments = this.done;
		this.done = [];
		this.segmentStart = this.playing && open !== null ? this.last : null;
		return segments;
	}

	hasActivity(): boolean {
		return (
			this.done.length > 0 ||
			( this.segmentStart !== null && this.last !== null && this.last > this.segmentStart )
		);
	}
}
