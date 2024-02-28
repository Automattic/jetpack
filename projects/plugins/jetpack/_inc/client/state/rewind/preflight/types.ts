export const PreflightTestStatus = {
	SUCCESS: 'success',
	IN_PROGRESS: 'in-progress',
	PENDING: 'pending',
	FAILED: 'failed',
} as const;

export type PreflightTestStatusType =
	( typeof PreflightTestStatus )[ keyof typeof PreflightTestStatus ];

export interface PreflightTest {
	test: string;
	status: PreflightTestStatusType;
}

export interface PreflightState {
	isFetching: boolean;
	hasLoaded: boolean;
	overallStatus: PreflightTestStatusType;
	tests: PreflightTest[];
	error: object | null;
}
