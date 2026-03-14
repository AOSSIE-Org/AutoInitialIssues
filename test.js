/**
 * Unit tests for AutoInitialIssues GitHub Action
 *
 * Mocks: @actions/core, @actions/github, global.fetch
 * Tests: parser, issues, agent, and the run() entrypoint
 */

// ── Mock @actions/core ──────────────────────────────────────────────
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
}));

// ── Mock @actions/github ────────────────────────────────────────────
const mockCreate = jest.fn().mockResolvedValue({});
jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(() => ({
    rest: { issues: { create: mockCreate } },
  })),
  context: {
    repo: { owner: 'AOSSIE-Org', repo: 'TestRepo' },
  },
}));

const core = require('@actions/core');

// ── Helpers ─────────────────────────────────────────────────────────
function setInputs(map) {
  core.getInput.mockImplementation((name) => map[name] || '');
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = undefined;
});

// ═══════════════════════════════════════════════════════════════════
//  parser.js
// ═══════════════════════════════════════════════════════════════════
describe('parser', () => {
  const { getBaseIssues, getPresetIssues } = require('./src/parser');

  test('getBaseIssues returns issues from _base/issues.json', () => {
    const issues = getBaseIssues();
    expect(Array.isArray(issues)).toBe(true);
  });

  test('getPresetIssues returns issues for a valid preset', () => {
    const issues = getPresetIssues('frontend-nextjs');
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThan(0);
  });

  test('getPresetIssues falls back to default for unknown framework', () => {
    const issues = getPresetIssues('frontend-unknownframework');
    expect(Array.isArray(issues)).toBe(true);
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('not found. Falling back to default')
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
//  issues.js
// ═══════════════════════════════════════════════════════════════════
describe('createIssues', () => {
  const { createIssues } = require('./src/issues');

  test('creates issues via octokit', async () => {
    const issues = [
      { title: 'Test Issue', body: 'Body text', labels: ['bug'] },
    ];
    await createIssues('fake_token', issues, '');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'AOSSIE-Org',
        repo: 'TestRepo',
        title: 'Test Issue',
        body: 'Body text',
        labels: ['bug'],
      })
    );
  });

  test('skips issues with missing title', async () => {
    const issues = [{ body: 'no title here', labels: [] }];
    await createIssues('fake_token', issues, '');

    expect(mockCreate).not.toHaveBeenCalled();
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('invalid or missing title')
    );
  });

  test('does nothing when issues array is empty', async () => {
    await createIssues('fake_token', [], '');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith('No issues to create.');
  });

  test('appends labelPrefix to labels', async () => {
    const issues = [{ title: 'A', body: 'B', labels: ['enhancement'] }];
    await createIssues('fake_token', issues, 'auto');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: expect.arrayContaining(['enhancement', 'auto']),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
//  agent.js
// ═══════════════════════════════════════════════════════════════════
describe('getAIIssues', () => {
  const { getAIIssues } = require('./src/agent');

  const validResponse = {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              issues: [
                { title: 'AI Issue', body: 'Generated', labels: ['ai'] },
              ],
            }),
          },
        },
      ],
    }),
  };

  test('returns parsed issues on successful API response', async () => {
    global.fetch = jest.fn().mockResolvedValue(validResponse);

    const issues = await getAIIssues(
      'token', 'A Next.js app', '', 'frontend', '', 5, '[]'
    );
    expect(issues).toEqual([
      { title: 'AI Issue', body: 'Generated', labels: ['ai'] },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://models.github.ai/inference/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('returns [] and warns on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const issues = await getAIIssues(
      'token', 'desc', '', '', '', 5, '[]'
    );
    expect(issues).toEqual([]);
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('500')
    );
  });

  test('returns [] and warns on malformed JSON from AI', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'NOT VALID JSON' } }],
      }),
    });

    const issues = await getAIIssues(
      'token', 'desc', '', '', '', 5, '[]'
    );
    expect(issues).toEqual([]);
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse AI response')
    );
  });

  test('filters out issues missing required fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                issues: [
                  { title: 'Good', body: 'ok', labels: [] },
                  null,
                  "text",
                  { body: 'no title', labels: [] },
                ],
              }),
            },
          },
        ],
      }),
    });

    const issues = await getAIIssues(
      'token', 'desc', '', '', '', 5, '[]'
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].title).toBe('Good');
  });

  test('merges base issues and prioritizes them over AI issues when maxIssues is small', async () => {
    const baseIssues = [{ title: 'Base Issue', body: 'Mandatory', labels: ['base'] }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                issues: [
                  { title: 'AI Issue 1', body: 'AI 1', labels: ['ai'] },
                  { title: 'AI Issue 2', body: 'AI 2', labels: ['ai'] },
                ],
              }),
            },
          },
        ],
      }),
    });

    const maxIssues = 2; // Only room for 1 AI issue
    const issues = await getAIIssues(
      'token', 'desc', '', '', '', maxIssues, JSON.stringify(baseIssues)
    );

    expect(issues).toHaveLength(2);
    expect(issues[0].title).toBe('Base Issue');
    expect(issues[1].title).toBe('AI Issue 1');
  });

  test('deduplicates AI issues if they have the same title as base issues', async () => {
    const baseIssues = [{ title: 'Duplicate Title', body: 'Base version', labels: ['base'] }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                issues: [
                  { title: 'Duplicate Title', body: 'AI version', labels: ['ai'] },
                  { title: 'Unique AI', body: 'AI unique', labels: ['ai'] },
                ],
              }),
            },
          },
        ],
      }),
    });

    const issues = await getAIIssues(
      'token', 'desc', '', '', '', 10, JSON.stringify(baseIssues)
    );

    expect(issues).toHaveLength(2);
    expect(issues[0].title).toBe('Duplicate Title');
    expect(issues[0].body).toBe('Base version');
    expect(issues[1].title).toBe('Unique AI');
  });
});

// ═══════════════════════════════════════════════════════════════════
//  index.js (run entrypoint) — loaded fresh to avoid auto-executing
// ═══════════════════════════════════════════════════════════════════
describe('run() entrypoint', () => {
  test('preset mode: creates issues from preset bank', async () => {
    setInputs({
      mode: 'preset',
      preset: 'frontend-nextjs',
      github_token: 'fake_token',
    });
    mockCreate.mockResolvedValue({});

    let run;
    jest.isolateModules(() => {
      run = require('./src/index').run;
    });
    await run();

    expect(core.info).toHaveBeenCalledWith('Running in Tier 1: preset mode');
    expect(core.setOutput).toHaveBeenCalledWith(
      'issues_created',
      expect.any(Number)
    );
  });

  test('fails fast when github_token is missing', async () => {
    setInputs({ mode: 'preset', preset: 'frontend-nextjs', github_token: '' });

    let run;
    jest.isolateModules(() => {
      run = require('./src/index').run;
    });
    await run();

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('github_token is required')
    );
  });
});
