// Types for the Studio edits REST contract, mirrored exactly from the
// endpoints registered by src/class-videopress-studio-mock-edits.php (and,
// later, the real WPCOM proxy at the same routes):
//
//   GET    /wpcom/v2/videopress/{guid}/edits
//   POST   /wpcom/v2/videopress/{guid}/edits   { base_revision, operations }
//   DELETE /wpcom/v2/videopress/{guid}/edits
//   GET    /wpcom/v2/videopress/{guid}/storyboard
//
// All timestamps are integer milliseconds on the ORIGINAL master timeline;
// editing is non-destructive (the server keeps the original master).

/**
 * One serialized edit operation. Structurally identical to the state core's
 * EditOperation (components/editor/state/edit-session.ts), duplicated here so
 * the transport types stay dependency-free.
 */
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

/**
 * 202 response body of POST/DELETE /wpcom/v2/videopress/{guid}/edits. The
 * `revision` is the revision the job was based on, NOT the one it produces
 * (that is `job.target_revision`).
 */
export type SaveEditsResponse = {
	guid: string;
	revision: number;
	job: EditsJob;
};

/**
 * GET /wpcom/v2/videopress/{guid}/storyboard response body. The local mock
 * always 404s (`storyboard_unavailable`); this is the documented shape the
 * future WPCOM endpoint will return.
 */
export type Storyboard = {
	/** URL of the tile sprite image. */
	url: string;
	tile_width: number;
	tile_height: number;
	/** Total number of tiles in the sprite. */
	tiles: number;
	/** Tiles per sprite row (physical sprite columns). */
	columns: number;
	/**
	 * Physical sprite rows. The sheet is a fixed columns x rows cell grid
	 * (padded with blank cells past `tiles`), so this is NOT ceil(tiles/columns)
	 * — it must come from the sprite. Optional for backends that predate it;
	 * consumers fall back to ceil(tiles/columns) when absent.
	 */
	rows?: number;
	/** Time covered by each tile, in ms. */
	interval_ms: number;
};
