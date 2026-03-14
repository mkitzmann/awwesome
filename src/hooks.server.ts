import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';

function runSeed() {
	const seedScript = path.resolve('scripts/seed.ts');
	console.log(`[seed] Starting seed at ${new Date().toISOString()}`);

	const child = spawn('npx', ['tsx', seedScript], {
		cwd: path.resolve('.'),
		stdio: 'inherit'
	});

	child.on('close', (code) => {
		if (code === 0) {
			console.log(`[seed] Completed successfully at ${new Date().toISOString()}`);
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
