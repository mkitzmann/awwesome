import slugify from '@sindresorhus/slugify';

/**
 * Parse the output of `git log --reverse --diff-filter=A --format=%aI --name-only`
 * into a map of filename → ISO date string (first-added date).
 *
 * Output format: alternating lines of date and filename(s), separated by blank lines.
 * Only the first occurrence of each file is recorded (the earliest date).
 */
export function parseFirstAddedOutput(output: string): Map<string, string> {
	const map = new Map<string, string>();
	let currentDate = '';

	for (const line of output.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
			currentDate = trimmed;
		} else if (trimmed.startsWith('software/') && currentDate) {
			if (!map.has(trimmed)) {
				map.set(trimmed, currentDate);
			}
		}
	}

	return map;
}

/**
 * Convert a tag YAML filename into a URL path.
 * Tag filenames encode hierarchy with "---" separators.
 * e.g. "communication---email---complete-solutions.yml" → "/communication/email/complete-solutions"
 *      "dns.yml" → "/dns"
 */
export function tagFilenameToPath(filename: string): string {
	const stem = filename.replace('.yml', '');
	const parts = stem.split('---');
	return '/' + parts.map((p) => slugify(p)).join('/');
}
