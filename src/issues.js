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
      if (!issue.title || typeof issue.title !== 'string') {
        core.warning(`Skipping issue with invalid or missing title: ${JSON.stringify(issue)}`);
        continue;
    }
      let labels = [...(issue.labels || [])];
      if (labelPrefix) {
        labels.push(labelPrefix);
      }
      
      await octokit.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: issue.title,
        body: issue.body||'',
        labels: (Array.isArray(labels) ? labels : Object.values(labels)).filter(l => typeof l === 'string')
      });
      core.info(`Created issue: ${issue.title}`);
    } catch (error) {
      core.warning(`Failed to create issue "${issue.title}": ${error.message}`);
    }
  }
}

module.exports = {
  createIssues
};
