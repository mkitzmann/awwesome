import { describe, it, expect } from 'vitest';
import { removeTrailingSlashes } from '$lib/index';
import { buildCategoryTree } from '$lib/server/db/queries';

describe('removeTrailingSlashes', () => {
	it('removes a trailing slash', () => {
		expect(removeTrailingSlashes('/communication/')).toBe('/communication');
	});

	it('leaves paths without trailing slash unchanged', () => {
		expect(removeTrailingSlashes('/communication')).toBe('/communication');
	});

	it('removes only the last trailing slash', () => {
		expect(removeTrailingSlashes('/a/b/c/')).toBe('/a/b/c');
	});

	it('returns undefined for undefined input', () => {
		expect(removeTrailingSlashes(undefined)).toBeUndefined();
	});

	it('returns undefined for non-string input', () => {
		expect(removeTrailingSlashes(42)).toBeUndefined();
	});

	it('returns undefined for empty string', () => {
		expect(removeTrailingSlashes('')).toBeUndefined();
	});
});

describe('buildCategoryTree', () => {
	it('builds a flat list of root categories', () => {
		const rows = [
			{ id: 1, slug: 'dns', name: 'DNS', parentId: null, fullPath: '/dns' },
			{ id: 2, slug: 'media', name: 'Media', parentId: null, fullPath: '/media' }
		];
		const tree = buildCategoryTree(rows);
		expect(tree).toHaveLength(2);
		expect(tree[0].slug).toBe('dns');
		expect(tree[1].slug).toBe('media');
		expect(tree[0].children).toHaveLength(0);
	});

	it('nests children under their parent', () => {
		const rows = [
			{
				id: 1,
				slug: 'communication',
				name: 'Communication',
				parentId: null,
				fullPath: '/communication'
			},
			{ id: 2, slug: 'email', name: 'Email', parentId: 1, fullPath: '/communication/email' },
			{ id: 3, slug: 'chat', name: 'Chat', parentId: 1, fullPath: '/communication/chat' }
		];
		const tree = buildCategoryTree(rows);
		expect(tree).toHaveLength(1);
		expect(tree[0].children).toHaveLength(2);
		expect(tree[0].children?.[0].slug).toBe('chat');
		expect(tree[0].children?.[1].slug).toBe('email');
	});

	it('handles deeply nested categories', () => {
		const rows = [
			{
				id: 1,
				slug: 'communication',
				name: 'Communication',
				parentId: null,
				fullPath: '/communication'
			},
			{ id: 2, slug: 'email', name: 'Email', parentId: 1, fullPath: '/communication/email' },
			{
				id: 3,
				slug: 'complete-solutions',
				name: 'Complete Solutions',
				parentId: 2,
				fullPath: '/communication/email/complete-solutions'
			}
		];
		const tree = buildCategoryTree(rows);
		expect(tree).toHaveLength(1);
		expect(tree[0].children).toHaveLength(1);
		expect(tree[0].children?.[0].children).toHaveLength(1);
		expect(tree[0].children?.[0].children?.[0].slug).toBe('complete-solutions');
	});

	it('sorts siblings alphabetically by slug', () => {
		const rows = [
			{ id: 1, slug: 'zebra', name: 'Zebra', parentId: null, fullPath: '/zebra' },
			{ id: 2, slug: 'alpha', name: 'Alpha', parentId: null, fullPath: '/alpha' },
			{ id: 3, slug: 'middle', name: 'Middle', parentId: null, fullPath: '/middle' }
		];
		const tree = buildCategoryTree(rows);
		expect(tree.map((c) => c.slug)).toEqual(['alpha', 'middle', 'zebra']);
	});

	it('returns an empty array for empty input', () => {
		expect(buildCategoryTree([])).toEqual([]);
	});
});
