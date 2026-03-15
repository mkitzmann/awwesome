import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { invalidateCaches } from '$lib/server/db/queries';

let seeding = false;

function runSeed() {
	if (seeding) {
		console.log(`[seed] Already running, skipping`);
		return;
	}
	seeding = true;

	const seedScript = path.resolve('scripts/seed.ts');
	const tsxBin = path.resolve('node_modules/.bin/tsx');
	console.log(`[seed] Starting seed at ${new Date().toISOString()}`);

	const child = spawn(tsxBin, [seedScript], {
		cwd: path.resolve('.'),
		stdio: 'inherit'
	});

	child.on('close', (code) => {
		seeding = false;
		if (code === 0) {
			console.log(`[seed] Completed successfully at ${new Date().toISOString()}`);
			invalidateCaches();
		} else {
			console.error(`[seed] Failed with exit code ${code}`);
		}
	});
}

export async function init() {
	// Seed on first startup
	runSeed();

	// Re-seed daily at 4am UTC
	cron.schedule('0 4 * * *', runSeed, { timezone: 'UTC' });
}
