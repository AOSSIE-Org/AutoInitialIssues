const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

function getBaseIssues() {
  const basePath = path.join(__dirname, '..', 'issue-banks', '_base', 'issues.json');
  if (fs.existsSync(basePath)) {
    try {
      return JSON.parse(fs.readFileSync(basePath, 'utf8')).issues.default || [];
    } catch (error) {
      core.warning(`Failed to parse base issues: ${error.message}`);
      return [];
    }
  }
  return [];
}

function getPresetIssues(preset) {
  // preset could be "frontend-nextjs" or "frontend"
  const parts = preset.split('-');
  const category = parts[0];
  const framework = parts.length > 1 ? parts.slice(1).join('-') : 'default';

  let issuePath = path.join(__dirname, '..', 'issue-banks', category, `${framework}.json`);
  
  // Fallback to default if framework specific doesn't exist
  if (!fs.existsSync(issuePath)) {
    core.warning(`Warning: Preset file ${issuePath} not found. Falling back to default.`);
    issuePath = path.join(__dirname, '..', 'issue-banks', category, 'default.json');
  }
  
  if (!fs.existsSync(issuePath)) {
    core.setFailed(`Preset category file not found: ${issuePath}`);
    return [];
  }

  const content = JSON.parse(fs.readFileSync(issuePath, 'utf8'));
  const issues = [];

  // Extract all categories of issues in the bank
  for (const key in content.issues) {
    issues.push(...content.issues[key]);
  }

  return issues;
}

function getIssueBankForCategory(category) {
  const categoryPath = path.join(__dirname, '..', 'issue-banks', category);
  if (!fs.existsSync(categoryPath)) return [];
  
  const files = fs.readdirSync(categoryPath);
  const banks = [];
  
  for (const file of files) {
      if (file.endsWith('.json')) {
        try{
          const content = JSON.parse(fs.readFileSync(path.join(categoryPath, file), 'utf8'));
          banks.push(content);
        }catch(error){
          core.warning(`Failed to parse issue bank: ${error.message}`);
          continue;
        }
      }
  }
  return banks;
}

module.exports = {
  getBaseIssues,
  getPresetIssues,
  getIssueBankForCategory
};
