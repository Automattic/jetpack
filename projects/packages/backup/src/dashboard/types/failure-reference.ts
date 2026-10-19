/** An id support can look a failure up by, and what it identifies. */
export type ReferenceId = {
	kind: 'backup' | 'restore' | 'download' | 'attempt';
	value: string | number;
};

/** What a reader can quote to support about a failure. Either half may be missing. */
export type FailureReference = {
	code: string | null;
	id: ReferenceId | null;
};
