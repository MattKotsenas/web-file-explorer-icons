import type { ReplacementSelectorSet, Site } from './index.js';

// TODO: The root idea probably doesn't work.

const mainRepositoryImplementation: ReplacementSelectorSet = {
	root: 'table[aria-label="Files table"]',
	row: 'table[aria-label="Files table"] tr',
	filename: 'td:nth-of-type(2) a',
	icon: 'td:nth-of-type(2) .fabric-icon',
	isDirectory: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-folder-icon'),
	isSubmodule: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-submodule'),
	isCollapsable: (_rowEl, _fileNameEl, _iconEl) => false,
};

const repositorySideTreeImplementation: ReplacementSelectorSet = {
	root: 'table[aria-label="File explorer tree"]',
	row: 'table[aria-label="File explorer tree"] tr',
	filename: 'td:nth-of-type(2) .repos-file-explorer-tree-cell a',
	icon: 'td:nth-of-type(2) .repos-file-explorer-tree-cell .fabric-icon:not(.bolt-tree-expand-button)',
	isDirectory: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-folder-icon'),
	isSubmodule: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-submodule'),
	isCollapsable: (_rowEl, _fileNameEl, _iconEl) =>
		repositorySideTreeImplementation.isDirectory(_rowEl, _fileNameEl, _iconEl),
};

export const azuredevops: Site = {
	domains: ['dev.azure.com'],
	replacements: [
		mainRepositoryImplementation,
		//fileContentsHeaderImplementation,
		//directoryContentsHeaderImplementation,
		repositorySideTreeImplementation,
	],
};
