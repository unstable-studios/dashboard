import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';

interface Variables {
	user: AuthUser;
}

const onboarding = new Hono<{ Bindings: Env; Variables: Variables }>();

// Starter categories for new users
const STARTER_CATEGORIES = [
	{ name: 'Productivity', icon: '⚡', slug: 'productivity', sort_order: 0 },
	{ name: 'Communication', icon: '💬', slug: 'communication', sort_order: 1 },
	{ name: 'Finance', icon: '💰', slug: 'finance', sort_order: 2 },
];

// Starter links mapped to category slugs
const STARTER_LINKS = [
	{ title: 'Gmail', url: 'https://mail.google.com', category_slug: 'communication', icon: '📧' },
	{ title: 'Slack', url: 'https://slack.com', category_slug: 'communication', icon: '💬' },
	{ title: 'Notion', url: 'https://notion.so', category_slug: 'productivity', icon: '📝' },
	{ title: 'Dropbox', url: 'https://dropbox.com', category_slug: 'productivity', icon: '📦' },
	{ title: 'GitHub', url: 'https://github.com', category_slug: 'productivity', icon: '🐙' },
];

// Welcome document content
const WELCOME_DOC = {
	title: 'Welcome to Echo Hub',
	slug: 'welcome-to-echo-hub',
	content: `# Welcome to Echo Hub

Echo Hub is your personal dashboard for organizing links, documents, and reminders in one place.

## Getting Started

Here are a few things you can do:

- **Add links**: Visit Settings (gear icon) to add your favorite websites and tools
- **Create documents**: Build your own knowledge base with markdown documents
- **Set reminders**: Keep track of important dates and recurring tasks
- **Pin favorites**: Right-click on links or documents to pin them to your dashboard

## Customizing Your Dashboard

Your dashboard shows pinned links, documents, and upcoming reminders. Pin the items you use most often for quick access.

## Need Help?

Explore the Settings page to customize your experience, including theme preferences and email notifications for reminders.

Enjoy using Echo Hub!`,
	excerpt: 'Get started with Echo Hub - your personal dashboard for links, documents, and reminders.',
};

// Sample reminder
const SAMPLE_REMINDER = {
	title: 'Explore Echo Hub Features',
	description: 'Take some time to explore the different features: add links, create documents, and set up reminders.',
	advance_notice_days: 7,
};

// Initialize onboarding for a new user
onboarding.post('/initialize', authMiddleware(), async (c) => {
	const user = c.get('user');

	// Check if onboarding already completed
	const prefs = await c.env.DB.prepare(
		'SELECT onboarding_completed FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first<{ onboarding_completed: number }>();

	if (prefs?.onboarding_completed === 1) {
		return c.json({
			success: true,
			alreadyCompleted: true,
			message: 'Onboarding already completed',
		});
	}

	const createdContent = {
		categories: [] as { id: number; name: string; slug: string }[],
		links: [] as { id: number; title: string }[],
		document: null as { id: number; title: string; slug: string } | null,
		reminder: null as { id: number; title: string } | null,
	};

	// Create starter categories
	const categoryIdMap: Record<string, number> = {};
	for (const cat of STARTER_CATEGORIES) {
		try {
			const result = await c.env.DB.prepare(
				`INSERT INTO categories (name, slug, icon, sort_order, owner_id)
				 VALUES (?, ?, ?, ?, ?)`
			)
				.bind(cat.name, cat.slug, cat.icon, cat.sort_order, user.sub)
				.run();

			const catId = result.meta.last_row_id as number;
			categoryIdMap[cat.slug] = catId;
			createdContent.categories.push({ id: catId, name: cat.name, slug: cat.slug });
		} catch {
			// Category might already exist for this user, skip
		}
	}

	// Create starter links
	for (const link of STARTER_LINKS) {
		try {
			const categoryId = categoryIdMap[link.category_slug] || null;
			const result = await c.env.DB.prepare(
				`INSERT INTO service_links (title, url, icon, icon_type, category_id, owner_id)
				 VALUES (?, ?, ?, 'emoji', ?, ?)`
			)
				.bind(link.title, link.url, link.icon, categoryId, user.sub)
				.run();

			createdContent.links.push({
				id: result.meta.last_row_id as number,
				title: link.title,
			});
		} catch {
			// Link might already exist, skip
		}
	}

	// Create welcome document
	try {
		const result = await c.env.DB.prepare(
			`INSERT INTO documents (title, slug, content, excerpt, is_published, created_by, updated_by, owner_id)
			 VALUES (?, ?, ?, ?, 1, ?, ?, ?)`
		)
			.bind(
				WELCOME_DOC.title,
				WELCOME_DOC.slug,
				WELCOME_DOC.content,
				WELCOME_DOC.excerpt,
				user.email,
				user.email,
				user.sub
			)
			.run();

		createdContent.document = {
			id: result.meta.last_row_id as number,
			title: WELCOME_DOC.title,
			slug: WELCOME_DOC.slug,
		};
	} catch {
		// Document might already exist, skip
	}

	// Create sample reminder (7 days from now)
	try {
		const nextDue = new Date();
		nextDue.setDate(nextDue.getDate() + 7);
		const nextDueStr = nextDue.toISOString().split('T')[0];

		const result = await c.env.DB.prepare(
			`INSERT INTO reminders (title, description, next_due, advance_notice_days, is_global, owner_id)
			 VALUES (?, ?, ?, ?, 0, ?)`
		)
			.bind(
				SAMPLE_REMINDER.title,
				SAMPLE_REMINDER.description,
				nextDueStr,
				SAMPLE_REMINDER.advance_notice_days,
				user.sub
			)
			.run();

		createdContent.reminder = {
			id: result.meta.last_row_id as number,
			title: SAMPLE_REMINDER.title,
		};
	} catch {
		// Reminder creation failed, skip
	}

	// Mark onboarding as completed
	const now = new Date().toISOString();
	const existingPrefs = await c.env.DB.prepare(
		'SELECT user_id FROM user_preferences WHERE user_id = ?'
	)
		.bind(user.sub)
		.first();

	if (existingPrefs) {
		await c.env.DB.prepare(
			`UPDATE user_preferences
			 SET onboarding_completed = 1, onboarding_completed_at = ?, updated_at = CURRENT_TIMESTAMP
			 WHERE user_id = ?`
		)
			.bind(now, user.sub)
			.run();
	} else {
		await c.env.DB.prepare(
			`INSERT INTO user_preferences (user_id, theme, onboarding_completed, onboarding_completed_at)
			 VALUES (?, 'system', 1, ?)`
		)
			.bind(user.sub, now)
			.run();
	}

	return c.json({
		success: true,
		alreadyCompleted: false,
		created: createdContent,
	});
});

export default onboarding;
