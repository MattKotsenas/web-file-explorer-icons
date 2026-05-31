import type { ReplacementSelectorSet, Site } from ".";
import { ATTRIBUTE_PREFIX } from "../constants";

const repositorySideTreeImplementation: ReplacementSelectorSet = {
	row: '.repos-file-explorer-tree-cell',
	filename: 'a',
	icon: '.fluent-icons-enabled:not(:has(.ms-Icon--ChevronRightMed, .ms-Icon--ChevronDownMed)) > span',
	async setupObserver(row, replace) {
		await replace();

		const observer = new MutationObserver((mutations) => {
			const nodes = mutations
				.map(mutation => Array.from(mutation.addedNodes))
				.filter(nodes => nodes.length > 0)
				.flat() as Array<Element>

			// Prevent detecting our <svg> manipulations.
			//
			// If a single node in a single mutation does NOT have our manipulation
			// we still run `replace()` again though.
			if (nodes.length > 0 && nodes.every(node =>
				node.hasAttribute(ATTRIBUTE_PREFIX)
				&& node.getAttribute(ATTRIBUTE_PREFIX + "-filename") === row.textContent.trim()
			)) return;

			replace();
		});

		observer.observe(row, {
			subtree: true,
			childList: true,
			characterData: true,
			characterDataOldValue: true
		});
	},
	isDirectory: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-folder-icon'),
	isSubmodule: (_rowEl, _fileNameEl, _iconEl) =>
		false, // TODO
	isCollapsable: (rowEl, fileNameEl, iconEl) =>
		repositorySideTreeImplementation.isDirectory(rowEl, fileNameEl, iconEl)
};
repositorySideTreeImplementation.styles = /* css */ `
${repositorySideTreeImplementation.row} {
	/* Hide directory icons by default. */
	svg {
		display: none !important;
	}

	/* Show relevant extension directory icon depending on open/closed state. */
	&:has(.ms-Icon--ChevronDownMed) svg[${ATTRIBUTE_PREFIX}-iconname$='_open'],
	&:has(.ms-Icon--ChevronRightMed) svg:not([${ATTRIBUTE_PREFIX}-iconname$='_open']) {
		display: inline-block !important;
	}
}
`.trim();

const repositoryMainImplementation: ReplacementSelectorSet = {
	row: '.repos-files-hub-page tbody [aria-colindex=\'1\']',
	filename: 'a',
	icon: '.fluent-icons-enabled > span',
	isDirectory: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-folder-icon'),
	isSubmodule: (_rowEl, _fileNameEl, _iconEl) =>
		false, // TODO
	isCollapsable: (_rowEl, _fileNameEl, _iconEl) =>
		false,
};

// Covers both single-commit views (`/commit/<sha>`) and PR diff "Files" tabs
// (`/pullrequest/<id>?_a=files`). Both render the changed-files tree inside a
// `table.repos-changes-explorer-tree`, which is the class that distinguishes
// this tree from the home-page side tree (`table.repos-file-explorer-tree`
// only, no `repos-changes-explorer-tree`).
const changesExplorerTreeImplementation: ReplacementSelectorSet = {
	row: '.repos-changes-explorer-tree .bolt-tree-row .bolt-tree-cell .bolt-table-cell-content',
	filename: '.text-ellipsis',
	icon: '.fluent-icons-enabled > span:not(.bolt-tree-expand-button)',
	async setupObserver(row, replace) {
		await replace();

		// Azure DevOps recycles `.bolt-table-cell-content` wrappers when the diff
		// tree re-flows (e.g. on every collapse/expand). The wrapper stays in the
		// DOM but its inner text and native icon are swapped out for a different
		// file, leaving our stale <svg> behind. Watch this row's subtree for
		// mutations and re-run replace() whenever our svg's filename no longer
		// matches the row's current text.
		const observer = new MutationObserver(() => {
			const raw = row.querySelector('.text-ellipsis')?.textContent?.trim();
			if (!raw) return;
			const expected = raw.split('/').at(-1)!.trim();
			const ourSvgs = row.querySelectorAll(`svg[${ATTRIBUTE_PREFIX}]`);
			const allMatch = ourSvgs.length > 0 && Array.from(ourSvgs).every(
				s => s.getAttribute(`${ATTRIBUTE_PREFIX}-filename`) === expected,
			);
			if (allMatch) return;
			// Strip stale svgs so replaceIconInRow starts from the original DOM
			// shape (native span hidden via inline style, no prior siblings).
			for (const s of ourSvgs) s.remove();
			replace();
		});
		observer.observe(row, {
			subtree: true,
			childList: true,
			characterData: true,
		});
	},
	isDirectory: (_rowEl, _fileNameEl, iconEl) =>
		iconEl.classList.contains('repos-folder-icon'),
	isSubmodule: (_rowEl, _fileNameEl, _iconEl) =>
		false, // TODO
	isCollapsable: (rowEl, fileNameEl, iconEl) =>
		changesExplorerTreeImplementation.isDirectory(rowEl, fileNameEl, iconEl),
};
changesExplorerTreeImplementation.styles = /* css */ `
${changesExplorerTreeImplementation.row} {
	/* Hide native folder icons by default. */
	svg {
		display: none !important;
	}

	/* Show the appropriate extension icon depending on the row's expansion
	   state. Leaf file rows have no aria-expanded; show the closed/file icon. */
	.bolt-tree-row[aria-expanded='true'] & svg[${ATTRIBUTE_PREFIX}-iconname$='_open'],
	.bolt-tree-row[aria-expanded='false'] & svg[${ATTRIBUTE_PREFIX}]:not([${ATTRIBUTE_PREFIX}-iconname$='_open']),
	.bolt-tree-row:not([aria-expanded]) & svg[${ATTRIBUTE_PREFIX}]:not([${ATTRIBUTE_PREFIX}-iconname$='_open']) {
		display: inline-block !important;
	}
}
`.trim();

export const devops: Site = {
	domains: ['dev.azure.com'],
	replacements: [
		repositorySideTreeImplementation,
		repositoryMainImplementation,
		changesExplorerTreeImplementation,
	]
};
