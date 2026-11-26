/**
 * Internal dependencies
 */
import { recordAdapter } from '../record-adapter';
import { postsHeaderActions } from './header-actions';
import type { SingleReportAdapter } from '../../../single-report/pages';

export const postsAdapter: SingleReportAdapter = {
	...recordAdapter,
	headerActions: postsHeaderActions,
};
