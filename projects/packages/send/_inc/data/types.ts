export type DnsPurpose = 'lockdown' | 'spf' | 'dkim';

export type DnsRecord = {
	type: string;
	name: string;
	value: string;
	purpose: DnsPurpose;
};

export type DnsCheck = {
	checked_at: string;
	domain_lockdown: string;
	spf: string;
	dkim: string;
	sender_domain: string;
	existing_spf: string;
};

export type Account = {
	handle: string;
	lockdown_auth_id: string;
	domain: string;
	dkim_selector: string;
	monthly_limit: number;
	dns_records: DnsRecord[];
	provider: 'wpcom' | 'local';
	provisioned_at: string;
	dns_check: DnsCheck | null;
	existing_spf?: string;
};

export type Settings = {
	enabled: boolean;
	from_name: string;
	from_local_part: string;
	fallback: boolean;
};

export type EnableBlocker = 'not_set_up' | 'dns_not_checked' | 'domain_lockdown' | 'sender_domain';

export type SpfSuggestion = {
	value: string;
	state: 'new' | 'merge' | 'present';
};

export type SendStatus = {
	provisioner: 'wpcom' | 'local' | null;
	account: Account | null;
	settings: Settings;
	can_enable: boolean;
	enable_blockers: EnableBlocker[];
	suggested_domain: string;
	site_title: string;
	admin_email: string;
	connect_url: string;
	spf_suggestion: SpfSuggestion | null;
	reset_warning?: string;
};

export type Usage = {
	total_usage: number;
	monthly_limit: number;
	period_start: string;
	period_end: string;
};

export type LogRow = {
	id: string;
	created_at: string;
	recipients: string;
	subject: string;
	status: 'sent' | 'fallback' | 'failed';
	error: string;
	request_id: string;
	source: 'wp_mail' | 'test';
};

export type LogPage = {
	items: LogRow[];
	total: number;
};

export type TestResult = {
	success: boolean;
	request_id?: string;
	error?: string;
};
