export type ThreatStatus = 'fixed' | 'ignored' | 'current';

export type ThreatFixType = 'replace' | 'delete' | 'update' | string;

export type Threat = {
	/** The threat's unique ID. */
	id: number;

	/** The threat's signature. */
	signature: string;

	/** The threat's title. */
	title: string;

	/** The threat's description. */
	description: string;

	/** The threat's current status. */
	status: ThreatStatus;

	/** The threat's severity level (0-10). */
	severity: number;

	/** The date the threat was first detected on the site, in YYYY-MM-DDTHH:MM:SS.000Z format. */
	firstDetected: string;

	/** The version the threat is fixed in. */
	fixedIn?: string | null;

	/** The date the threat was fixed, in YYYY-MM-DDTHH:MM:SS.000Z format. */
	fixedOn?: string | null;

	/** The fixable details. */
	fixable:
		| {
				fixer: ThreatFixType;
				target?: string | null;
				extensionStatus?: string | null;
		  }
		| false;

	/** The threat's source. */
	source?: string;

	/** The threat's context. */
	context?: Record< string, unknown > | null;

	/** The name of the affected file. */
	filename: string | null;

	/** The rows affected by the database threat. */
	rows?: unknown;

	/** The table name of the database threat. */
	table?: string;

	/** The diff showing the threat's modified file contents. */
	diff?: string;
};
