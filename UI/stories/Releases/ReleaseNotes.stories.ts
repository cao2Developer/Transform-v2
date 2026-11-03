import type { Meta, StoryObj } from '@storybook/web-components';

/**
 * # Release Notes
 *
 * Complete release history for all versions.
 *
 * Each release includes:
 * - New features
 * - Bug fixes and improvements
 * - Breaking changes (if any)
 * - Installation/upgrade instructions
 */
const meta: Meta = {
    title: 'Release Notes',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'List of releases including the current release with links to the relevant release notes.',
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

interface ReleaseVersion {
    version: string;
    description: string;
    date: string;
}

const releases: ReleaseVersion[] = [
    { version: 'v2.13.7.7.1', description: 'Bug fixes for ready for launch', date: '' },
    { version: 'v2.13.7.7', description: 'Multiple errors on a page', date: '' },
    { version: 'v2.13.7.6', description: 'Exclusive control in grids', date: '' },
    { version: 'v2.13.7.5', description: 'Dropdown width issues', date: '' },
    { version: 'v2.13.7.4', description: 'Mobile and exclusivity issues', date: '' },
    { version: 'v2.13.7.3', description: 'Japan et al', date: '' },
    { version: 'v2.13.7.2', description: 'Pre-release updates', date: '' },
    { version: 'v2.13.7.1', description: '2nd Patch release', date: '' },
    { version: 'v2.13.7', description: 'Multiple errors on a page', date: '' },
    { version: 'v2.13.6.1', description: 'Part II', date: '' },
    { version: 'v2.13.6', description: 'Requested updates', date: '' },
    { version: 'v2.13.5', description: 'Various fixes', date: '' },
    { version: 'v2.13.4', description: 'Edit layout, choice and list improvements', date: '' },
    { version: 'v2.13.3', description: 'Visibility fixes', date: '' },
    { version: 'v2.13.2', description: 'Buttons', date: '' },
    { version: 'v2.13.1', description: 'Reset to Null patch', date: '' },
    { version: 'v2.13', description: 'Base Survey Changes', date: '' },
    { version: 'v2.11', description: 'Off Path to placeholder change', date: '' },
    { version: 'v2.1', description: 'First v2 production release', date: '' },
];

const releaseContentStyles = `
  .release-code-block {
    margin: 1rem 0;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .release-code-summary {
    padding: 0.5rem;
    background: #f5f5f5;
    cursor: pointer;
    font-weight: bold;
  }

  .release-code-summary:hover {
    background: #e8e8e8;
  }

  .release-code-pre {
    padding: 1rem;
    overflow-x: auto;
    background: #f9f9f9;
    margin: 0;
  }

  .release-code {
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    line-height: 1.4;
  }
`;

/**
 * Latest Release
 *
 * View the most recent release notes with the latest features and fixes.
 */
export const History: Story = {
    render: () => {
        const releaseRows = releases
            .map(
                (r) =>
                    `<tr>
            <td><a href="/content-html/${r.version}.html" target="_blank">${r.version}</a></td>
            <td>${r.description}</td>
            <td>${r.date}</td>
          </tr>`,
            )
            .join('');

        return `
    <style>${releaseContentStyles}</style>
    <div style="padding: 2rem; max-width: 900px; font-family: system-ui, -apple-system, sans-serif;">
      <h1>📋 Release Notes</h1>
      
      <div>
        <p>
        Each release has its own notes that detail the changes including new features and resolved issues.
        A copy of those release notes are included here to make search and explore easier. </p>
        <h2>View release details:</h2>
        <p>
          A release note contains:
          <ul>
            <li>New features</li>
            <li>Issues resolved</li>
            <li>Known issues</li>
          </ul>
        </p>
      </div>

      <h2>Available Releases</h2>
      <p>The following releases are documented in this repository:</p>
      
      <details open>
        <summary style="cursor: pointer; font-weight: bold;">v2 Releases (Latest)</summary>
        <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Description</th>
            <th>Release Date</th>
          </tr>
        </thead>
        <tbody>
          ${releaseRows}
        </tbody>
        </table>
      </details>
    </div>
  `;
    },
};

