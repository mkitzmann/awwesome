import { describe, it, expect } from 'vitest';
import { parseFirstAddedOutput, tagFilenameToPath } from './seedUtils';

describe('parseFirstAddedOutput', () => {
	it('parses a single commit with one file', () => {
		const output = `2021-07-15T10:30:00+00:00
software/nextcloud.yml
`;
		const map = parseFirstAddedOutput(output);
		expect(map.get('software/nextcloud.yml')).toBe('2021-07-15T10:30:00+00:00');
		expect(map.size).toBe(1);
	});

	it('parses multiple commits with multiple files', () => {
		const output = `2021-07-15T10:30:00+00:00
software/nextcloud.yml
software/bitwarden.yml

2021-07-16T12:00:00+00:00
software/gitea.yml
`;
		const map = parseFirstAddedOutput(output);
		expect(map.size).toBe(3);
		expect(map.get('software/nextcloud.yml')).toBe('2021-07-15T10:30:00+00:00');
		expect(map.get('software/bitwarden.yml')).toBe('2021-07-15T10:30:00+00:00');
		expect(map.get('software/gitea.yml')).toBe('2021-07-16T12:00:00+00:00');
	});

	it('keeps only the first (earliest) occurrence of a file', () => {
		const output = `2021-01-01T00:00:00+00:00
software/app.yml

2022-06-15T00:00:00+00:00
software/app.yml
`;
		const map = parseFirstAddedOutput(output);
		expect(map.get('software/app.yml')).toBe('2021-01-01T00:00:00+00:00');
		expect(map.size).toBe(1);
	});

	it('ignores non-software files', () => {
		const output = `2021-07-15T10:30:00+00:00
tags/dns.yml
README.md
software/nextcloud.yml
`;
		const map = parseFirstAddedOutput(output);
		expect(map.size).toBe(1);
		expect(map.has('tags/dns.yml')).toBe(false);
		expect(map.has('README.md')).toBe(false);
	});

	it('returns an empty map for empty input', () => {
		expect(parseFirstAddedOutput('').size).toBe(0);
	});

	it('handles input with extra blank lines', () => {
		const output = `

2021-07-15T10:30:00+00:00

software/nextcloud.yml


`;
		const map = parseFirstAddedOutput(output);
		expect(map.get('software/nextcloud.yml')).toBe('2021-07-15T10:30:00+00:00');
	});

	it('ignores file lines that appear before any date', () => {
		const output = `software/orphan.yml

2021-07-15T10:30:00+00:00
software/nextcloud.yml
`;
		const map = parseFirstAddedOutput(output);
		expect(map.has('software/orphan.yml')).toBe(false);
		expect(map.get('software/nextcloud.yml')).toBe('2021-07-15T10:30:00+00:00');
	});
});

describe('tagFilenameToPath', () => {
	it('converts a simple tag filename', () => {
		expect(tagFilenameToPath('dns.yml')).toBe('/dns');
	});

	it('converts a nested tag filename with --- separators', () => {
		expect(tagFilenameToPath('communication---email---complete-solutions.yml')).toBe(
			'/communication/email/complete-solutions'
		);
	});

	it('converts a two-level tag filename', () => {
		expect(tagFilenameToPath('media---video.yml')).toBe('/media/video');
	});

	it('slugifies segments with spaces or special characters', () => {
		expect(tagFilenameToPath('file-transfer-and-synchronization.yml')).toBe(
			'/file-transfer-and-synchronization'
		);
	});
});
