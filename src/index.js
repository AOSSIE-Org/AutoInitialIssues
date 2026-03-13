const core = require('@actions/core');
const { getBaseIssues, getPresetIssues } = require('./parser');
const { getAIIssues } = require('./agent');
const { createIssues } = require('./issues');

async function run() {
  try {
    const mode = core.getInput('mode') || 'preset';
    const preset = core.getInput('preset');
    const projectDescription = core.getInput('project_description');
    const projectTemplate = core.getInput('project_template');
    const categories = core.getInput('categories');
    const skills = core.getInput('skills');
    const rawMaxIssues = core.getInput('max_issues');
    const parsedMaxIssues =
      rawMaxIssues === '' ? 15 : Number.parseInt(rawMaxIssues, 10);
    if (!Number.isInteger(parsedMaxIssues) || parsedMaxIssues < 0) {
      throw new Error('max_issues must be a non-negative integer');
    }
    const maxIssues = parsedMaxIssues;
    const labelPrefix = core.getInput('label_prefix');
    const token = core.getInput('github_token');
    if (!token) {
      throw new Error('github_token is required but was not provided.');
    }

    let finalIssues = [];
    const baseIssues = getBaseIssues();

    if (mode === 'preset') {
      core.info('Running in Tier 1: preset mode');
      if (!preset) {
        throw new Error('preset input is required in preset mode');
      }
      const presetIssues = getPresetIssues(preset);
      // Combine base + preset
      finalIssues = [...baseIssues, ...presetIssues];
    } else if (mode === 'prompt' || mode === 'advanced') {
      core.info(`Running in Tier 2/3: ${mode} mode`);
      if (!projectDescription) {
        throw new Error('project_description is required in prompt/advanced mode');
      }
      
      const baseIssuesStr = JSON.stringify(baseIssues, null, 2);
      finalIssues = await getAIIssues(
          token, 
          projectDescription, 
          projectTemplate, 
          categories, 
          skills, 
          maxIssues, 
          baseIssuesStr
      );
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }

    // Limit issues if config specifies
    if (finalIssues.length > maxIssues) {
        finalIssues = finalIssues.slice(0, maxIssues);
    }

    // Create the issues
    if (finalIssues.length === 0) {
      core.info('No issues to create, skipping issue creation.');
    } else {
      await createIssues(token, finalIssues, labelPrefix);
    }
    
    // Output success
    core.setOutput('issues_created', finalIssues.length);
    core.info(`Successfully processed ${finalIssues.length} issues.`);

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
