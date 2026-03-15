import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { invalidateCaches } from '$lib/server/db/queries';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	// Prevent CDN from serving stale HTML; static assets are fingerprinted and cached separately
	if (response.headers.get('content-type')?.includes('text/html')) {
		response.headers.set('Cache-Control', 'no-cache');
	}
	return response;
};

let running = false;

function runScript(label: string, script: string): Promise<number | null> {
	return new Promise((resolve) => {
		const tsxBin = path.resolve('node_modules/.bin/tsx');
		console.log(`[${label}] Starting at ${new Date().toISOString()}`);

		const child = spawn(tsxBin, [path.resolve(script)], {
			cwd: path.resolve('.'),
			stdio: 'inherit'
		});

		child.on('close', (code) => {
			if (code === 0) {
				console.log(`[${label}] Completed successfully at ${new Date().toISOString()}`);
			} else {
				console.error(`[${label}] Failed with exit code ${code}`);
			}
			resolve(code);
		});
	});
}

async function runDaily() {
	if (running) {
		console.log(`[daily] Already running, skipping`);
		return;
	}
	running = true;

	try {
		const seedCode = await runScript('seed', 'scripts/seed.ts');
		if (seedCode === 0) {
			invalidateCaches();
			await runScript('backfill-stars', 'scripts/backfill-stars.ts');
		}
	} finally {
		running = false;
	}
}

export async function init() {
	// Seed + backfill on first startup
	runDaily();

	// Re-seed + backfill daily at 4am UTC
	cron.schedule('0 4 * * *', runDaily, { timezone: 'UTC' });
}
