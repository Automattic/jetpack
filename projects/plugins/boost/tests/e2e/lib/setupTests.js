import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { chromium } from '@playwright/test';

export default async function () {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	await prerequisitesBuilder( page ).withLoggedIn( true ).withConnection( true ).build();
}
