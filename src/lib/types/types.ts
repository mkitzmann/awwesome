export type Project = {
	name: string | null;
	primary_url: string | null;
	source_url?: string | null;
	demo_url?: string | null;
	description?: string | null;
	license?: {
		name?: string;
		description?: string;
		url?: string;
		nickname?: string;
	};
	platforms?: string[];
	category?: string;
	stars?: number | null;
	avatar_url?: string | null;
	topics?: { name: string; path: string }[];
	commit_history?: CommitCount;
	trendingDelta?: number | null;
	trendingAbsolute?: number | null;
	releaseVersion?: string;
	releaseDate?: string;
	pushedAt?: Date;
	firstAdded?: Date;
	archived?: boolean;
};

export type CommitCount = {
	[key: string]: number;
};

export type SortTerm = 'stars' | 'firstAdded' | 'commitsYear' | 'trending' | 'trendingAbsolute' | 'releaseDate';
export type SortOrder = 'asc' | 'desc';

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

export interface PaginatedResult {
	projects: Project[];
	total: number;
}

export interface ProjectCollection {
	projects: Project[];
	total: number;
	categories: AllCategories;
	platforms: string[];
	licenses: string[];
	sort: SortTerm;
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
	createdAt?: string;
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
		description: string;
		url: string;
		nickname: string;
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
};
