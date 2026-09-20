// Edit timestamps use integer milliseconds on the retained original timeline.
export type ApiEditOperation = {
	type: 'trim' | 'cut';
	start_ms: number;
	end_ms: number;
};

export type EditsJobStatus = 'idle' | 'processing' | 'complete' | 'failed';

export type EditsJobError = {
	code: string;
	message: string;
};

/**
 * The transcode job attached to every edits response.
 */
export type EditsJob = {
	/** Server job id; null while idle. */
	id: string | null;
	status: EditsJobStatus;
	/** The revision the job will produce; null while idle. */
	target_revision: number | null;
	/** 0..0.99 while processing; null otherwise. */
	progress: number | null;
	/** Populated only when status is 'failed'. */
	error: EditsJobError | null;
};

/**
 * GET /wpcom/v2/videopress/{guid}/edits response body.
 */
export type VideoEdits = {
	guid: string;
	/** Monotonic revision of the committed operations list. */
	revision: number;
	original_duration_ms: number;
	/** Duration after applying the committed operations. */
	output_duration_ms: number;
	operations: ApiEditOperation[];
	can_restore_original: boolean;
	job: EditsJob;
	/** ISO8601 timestamp of the last edit-state change. */
	updated: string;
};

/** Accepted job; revision still identifies the committed operations. */
export type SaveEditsResponse = {
	guid: string;
	revision: number;
	job: EditsJob;
};

/** Original-timeline tile sheet returned by the storyboard endpoint. */
export type Storyboard = {
	/** URL of the tile sprite image. */
	url: string;
	tile_width: number;
	tile_height: number;
	/** Total number of tiles in the sprite. */
	tiles: number;
	/** Tiles per sprite row (physical sprite columns). */
	columns: number;
	/** Physical sheet rows, including padding; older responses may omit this. */
	rows?: number;
	/** Time covered by each tile, in ms. */
	interval_ms: number;
};
