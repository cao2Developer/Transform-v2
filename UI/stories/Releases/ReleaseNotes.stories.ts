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

/**
 * Latest Release
 *
 * View the most recent release notes with the latest features and fixes.
 */
export const Latest: Story = {
    render: () => `
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
        <ul style="margin: 1rem 0;">
          <li><a href="https://github.com/Ipsos-Alliance/Transform/releases" target="_blank">GitHub Releases Page</a> - Official release page</li>
          <li><a href="https://github.com/Ipsos-Alliance/Transform/tree/main/storybook/release-notes/content" target="_blank">Release Files</a> - Markdown files in repository</li>
        </ul>
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
          <tr>
            <td><a href="./content/v2.13.7.7.1.md" target="_blank">v2.13.7.7.1</a></td><td>Bug fixes for ready for launch</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.7.md" target="_blank">v2.13.7.7</a></td><td>Multiple errors on a page</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.6.md" target="_blank">v2.13.7.6</a></td><td>Exclusive control in grids</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.5.md" target="_blank">v2.13.7.5</a></td><td>Dropdown width issues</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.4.md" target="_blank">v2.13.7.4</a></td><td>Mobile and exclusivity issues</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.3.md" target="_blank">v2.13.7.3</a></td><td>Japan et al</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.2.md" target="_blank">v2.13.7.2</a></td><td>Pre-release updates</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.1.md" target="_blank">v2.13.7.1</a></td><td>2nd Patch release</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.7.md" target="_blank">v2.13.7</a></td><td>Multiple errors on a page</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.6.1.md" target="_blank">v2.13.6.1</a></td><td>Part II</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.6.md" target="_blank">v2.13.6</a></td><td>Requested updates</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.5.md" target="_blank">v2.13.5</a></td><td>Various fixes</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.4.md" target="_blank">v2.13.4</a></td><td>Edit layout, choice and list improvements</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.3.md" target="_blank">v2.13.3</a></td><td>Visibility fixes</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.2.md" target="_blank">v2.13.2</a></td><td>Buttons</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.13.1.md" target="_blank">v2.13.1</a></td><td>Reset to Null patch</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.11.md" target="_blank">v2.11</a></td><td>Off Path to placehoder change</td><td></td>
          </tr>
          <tr>
            <td><a href="./content/v2.1.md" target="_blank">v2.1</a></td><td>First v2 production release</td><td></td>
          </tr>
        </tbody>
        </table>
      </details>

      <h3 style="margin-top: 2rem;">📁 Access Release Files</h3>
      <p>Release notes are stored in: <code>storybook/release-notes/content/</code></p>
      <p>Each file is named: <code>v{VERSION}.md</code></p>

      <h3 style="margin-top: 2rem;">🔗 Quick Links</h3>
      <ul>
        <li><a href="https://github.com/Ipsos-Alliance/Transform/releases" target="_blank">View all releases on GitHub</a></li>
        <li><a href="https://github.com/Ipsos-Alliance/Transform/tree/main/storybook/release-notes/content" target="_blank">Browse release files</a></li>
      </ul>
    </div>
  `,
};

/**
 * Release Archive
 *
 * Complete list of all historical releases.
 */
export const Archive: Story = {
    render: () => `
    <div style="padding: 2rem; max-width: 900px; font-family: system-ui, -apple-system, sans-serif;">
      <h2>📚 Release Archive</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 2rem 0;">
        <thead>
          <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
            <th style="padding: 0.75rem; text-align: left;">Version</th>
            <th style="padding: 0.75rem; text-align: left;">File</th>
            <th style="padding: 0.75rem; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;"><strong>v2.13</strong></td>
            <td style="padding: 0.75rem;">v2.13.md</td>
            <td style="padding: 0.75rem; text-align: center;">✅ Latest</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">v2.13.7.7.1</td>
            <td style="padding: 0.75rem;">v2.13.7.7.1.md</td>
            <td style="padding: 0.75rem; text-align: center;">✅</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">v2.13.7.7</td>
            <td style="padding: 0.75rem;">v2.13.7.7.md</td>
            <td style="padding: 0.75rem; text-align: center;">✅</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee; background: #fafafa;">
            <td colspan="3" style="padding: 1rem; text-align: center; color: #666;">
              ... and 16 more releases
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 0.75rem;">v2.1</td>
            <td style="padding: 0.75rem;">v2.1.md</td>
            <td style="padding: 0.75rem; text-align: center;">✅</td>
          </tr>
        </tbody>
      </table>

      <div style="background: #fff3cd; padding: 1rem; border-radius: 4px; border-left: 4px solid #ffc107;">
        <strong>💡 Tip:</strong> Click the links above to view full release details on GitHub.
      </div>
    </div>
  `,
};
