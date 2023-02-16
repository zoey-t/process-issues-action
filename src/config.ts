export interface IConfigs {
	/**
	 * The auth token to use when fetching the repository
	 * token: required
	 */
	token: string

	/**
	 * proccess issue with this label only
	 * label: required
	 */
	publishLabel: string

	/**
	 * repo we fetch issues from
	 * src-repo: optional. current repo if empty
	 */
	srcRepo: IRepo

	/**
	 * repo we output md files to
	 * target-repo: optional. current repo if empty
	 */
	targetRepo: IRepo

	/**
	 * is-finding: optional. default true
	 * true: the issue is a finding issue
	 * false: the issue is a regular document issue
	 */
	finding: boolean

	/**
	 * true: batch processing all the issues with publish label
	 * false: processing a single issue
	 */
	bacth: boolean
}

export interface IFindingMD {
	fileName: string // markdown file name
	level: string // finding level
	priority: number // number indicates the priority
	md: string // markdown content
}

export interface IDocMD {
	fileName: string // markdown file name
	md: string //
}

export enum FindingLevel {
	High = 'high',
	Medium = 'medium',
	Low = 'low',
	Info = 'info',
	Undetermined = 'undetermined'
}

export interface IRepo {
	owner: string
	repo: string
}
