import DOMPurify from 'isomorphic-dompurify';

export function sanitize(html: string): string {
	return DOMPurify.sanitize(html);
}
