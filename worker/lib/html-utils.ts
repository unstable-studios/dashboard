/**
 * HTML escape utility to prevent XSS vulnerabilities.
 * Escapes HTML special characters in user-provided content.
 * 
 * Note: This should NOT be used for URLs in href attributes.
 * URLs should be validated or use proper URL encoding instead.
 */
export function escapeHtml(str: string | null | undefined): string {
	if (!str) return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
