export type Project = {
	name: string | null;
	primary_url: string | null;
	source_url: string | null;
	demo_url: string | null;
	description: string | null;
	license: string | null;
	stack: string | null;
	category?: string;
	stars?: number | null;
	avatar_url?: string | null;
	topics?: Topic[];
	commit_history?: {
		[key: string]: {
			totalCount: number;
		};
	};
	pushedAt: Date;
};

export interface AllCategories {
	tree: Category[];
	urls: Set<string>;
	names: { [key: string]: string };
}

export type Category = {
	slug: string;
	name: string;
	children?: Category[];
};

export interface ProjectCollection {
	projects: Project[];
	categories: AllCategories;
}

export interface GithubQueryResult {
	search: {
		repos: [
			{
				repo: GithubRepo;
			}
		];
	};
	rateLimit: {
		limit: number;
		cost: number;
		remaining: number;
		resetAt: string;
	};
}

export interface GithubRepo {
	url: string;
	name: string;
	owner?: {
		avatarUrl: string;
	};
	languages?: {
		edges: {
			node: {
				name: string;
			};
		}[];
	};
	archivedAt?: string;
	collaborators?: {
		totalCount: number;
	};
	descriptionHTML?: string;
	latestRelease?: {
		createdAt: string;
	};
	licenseInfo?: {
		name: string;
	};
	openGraphImageUrl?: string;
	stargazerCount?: number;
	repositoryTopics: { edges: [{ node: { topic: Topic } }] };
	defaultBranchRef: {
		target: {
			[key: string]: {
				totalCount: number;
			};
		};
	};
	pushedAt: string;
	openIssues?: {
		totalCount: number;
	};
}

export type Topic = {
	name: string;
	id: string;
};
