import { Extension, FixerStatus } from '.';

export interface BaseThreat {
	id: number;
	signature: string;
	description: string;
	status: ThreatStatus;
	firstDetected: Date;
	fixedOn?: Date;
	fixable: false | ThreatFix;
	fixerStatus?: FixerStatus;
	filename?: string;
	extension?: Extension;
	rows?: Record< string, unknown >;
	table?: string;
	diff?: string;
	context?: Record< string, unknown >;
	severity: number;
	source?: string;
	version?: string;
}

export interface FixableThreat extends BaseThreat {
	fixable: ThreatFix;
}

export interface IgnorableThreat extends BaseThreat {
	fixable: false;
}

export type Threat = IgnorableThreat | FixableThreat;

export type ThreatAction = 'fix' | 'ignore';

export type ThreatType = 'core' | 'file' | 'plugin' | 'theme' | 'database' | 'none' | string;

export type ThreatFixType = 'replace' | 'delete' | 'update' | string;

export type ThreatFix = {
	fixer: ThreatFixType;
	file?: string;
	target?: string;
};

export type ThreatStatus = 'fixed' | 'ignored' | 'current';

export type ThreatPayload =
	| 'backdoor'
	| 'ccskimmers'
	| 'cryptominer'
	| 'dropper'
	| 'generic'
	| 'hacktool'
	| 'hardening'
	| 'malware'
	| 'malvertising'
	| 'phishing'
	| 'redirect'
	| 'seospam'
	| 'suspicious'
	| 'uploader'
	| 'webshell';

export type SignatureComponents = {
	signatureId: string | undefined;
	language: string;
	payload: ThreatPayload | string;
	family: string;
	variant: string;
};
