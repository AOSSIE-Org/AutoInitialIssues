const github = require('@actions/github');
const core = require('@actions/core');

async function createIssues(token, issues, labelPrefix) {
  const octokit = github.getOctokit(token);
  const context = github.context;
  
  if (issues.length === 0) {
    core.info('No issues to create.');
    return;
  }

  core.info(`Found ${issues.length} issues to create.`);
  
  for (const issue of issues) {
    try {
      if (!issue || typeof issue !== 'object' || typeof issue.title !== 'string' || !issue.title.trim()) {
        core.warning(`Skipping issue with invalid or missing title: ${JSON.stringify(issue)}`);
        continue;
    }
      const rawLabels = issue.labels;
      let labels = Array.isArray(rawLabels)
        ? [...rawLabels]
        : (rawLabels && typeof rawLabels === 'object' ? Object.values(rawLabels) : []);
      if (labelPrefix) {
        labels.push(labelPrefix);
      }
      
      await octokit.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: issue.title,
        body: issue.body||'',
        labels:labels.filter(l => typeof l === 'string')
      });
      core.info(`Created issue: ${issue.title}`);
    } catch (error) {
      const safeTitle = issue && typeof issue === 'object' && typeof issue.title === 'string'
        ? issue.title
        : '<invalid issue>';
      const safeMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : String(error);
      core.warning(`Failed to create issue "${safeTitle}": ${safeMessage}`);
    }
  }
}

module.exports = {
  createIssues
};
