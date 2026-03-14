const core = require('@actions/core');

async function getAIIssues(token, projectDescription, projectTemplate, categoriesStr, skillsStr, maxIssues, baseIssuesStr) {
  try {
    const categories = categoriesStr ? categoriesStr.split(',').map(c => c.trim()).filter(Boolean) : [];
    const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    // We fetch category banks from the local parser
    const { getIssueBankForCategory } = require('./parser');
    
    const availableCategories = categories.length > 0 ? categories : ['frontend', 'backend', 'blockchain', 'ml', 'mobile', 'devops'];
    const loadedBanks = {};
    for (const cat of availableCategories) {
        loadedBanks[cat] = getIssueBankForCategory(cat);
    }

    const systemPrompt = `You are an expert technical project manager. You are tasked with generating GitHub issues for a new repository based on the project description.
You MUST include all the issues from the _base/issues.json list provided below. They are mandatory.
Then, selectively choose up to ${maxIssues} TOTAL issues from the provided category banks that best fit the project.
If the requested project stack uses a specific framework, try to find issues from that framework's JSON.
Return the output strictly in JSON format as a JSON object containing an "issues" array.
Format:
{
  "issues": [
    {
      "title": "String",
      "body": "String",
      "labels": ["String"]
    }
  ]
}
`;

    const userPrompt = `
MANDATORY BASE ISSUES:
${baseIssuesStr}

AVAILABLE CATEGORY BANKS:
${JSON.stringify(loadedBanks, null, 2)}

PROJECT DESCRIPTION:
${projectDescription}

${projectTemplate ? `AOSSIE TEMPLATE HINT: ${projectTemplate}` : ''}
${skills.length > 0 ? `REQUIRED SKILLS: ${skills.join(', ')}` : ''}

Please generate the issues JSON array.
`;

    // Wait for the fetch API to fetch models - NodeJS 18+ has native fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch("https://models.github.ai/inference/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        })
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        core.warning('GitHub Models API call timed out after 30 seconds.');
      } else {
        core.warning(`GitHub Models API call error: ${error.message}`);
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      core.warning(`GitHub Models API call failed: ${response.status} ${errorText}`);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data.choices) || data.choices.length === 0) {
      core.warning('GitHub Models API returned no choices.');
      return [];
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      core.warning('GitHub Models API response is missing message content.');
      return [];
    }

    let resultObj;
    try {
      resultObj = JSON.parse(content);
    } catch (parseError) {
      core.warning(`Failed to parse AI response as JSON: ${parseError.message}`);
      return [];
    }

    if (!Array.isArray(resultObj.issues)) {
      core.warning('AI response does not contain a valid "issues" array.');
      return [];
    }

    // Filter to only well-formed issue objects
    const validIssues = resultObj.issues.filter((issue, i) => {
      if (!issue || typeof issue !== 'object') {
        core.warning(`Issue at index ${i} is not an object, skipping.`);
        return false;
      }
      if (typeof issue.title !== 'string' || !issue.title.trim()) {
        core.warning(`Issue at index ${i} is missing a valid "title", skipping.`);
        return false;
      }
      if (typeof issue.body !== 'string') {
        core.warning(`Issue at index ${i} is missing a valid "body", skipping.`);
        return false;
      }
      if (!Array.isArray(issue.labels)) {
        issue.labels = [];
      }
      return true;
    });

    // Parse and normalize base issues
    let mandatoryBaseIssues = [];
    try {
      const parsedBase = JSON.parse(baseIssuesStr);
      mandatoryBaseIssues = Array.isArray(parsedBase) ? parsedBase : [];
    } catch {
      core.warning('Failed to parse mandatory base issues JSON.');
    }

    const normalizedBaseIssues = mandatoryBaseIssues
      .filter((issue) =>
        issue &&
        typeof issue === 'object' &&
        typeof issue.title === 'string' &&
        issue.title.trim() &&
        typeof issue.body === 'string'
      )
      .map((issue) => ({
        title: issue.title,
        body: issue.body,
        labels: Array.isArray(issue.labels) ? issue.labels : []
      }));

    // Merge issues with case-insensitive deduplication
    const merged = [];
    const seen = new Set();
    
    // Base issues always come first and are added to 'seen'
    for (const issue of normalizedBaseIssues) {
      const key = issue.title.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(issue);
      }
    }

    // AI issues are filtered against 'seen'
    const uniqueAIIssues = validIssues.filter(i => {
      const key = i.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Enforcement of maxIssues:
    // We must return ALL base issues, and then FILL up to maxIssues with AI issues.
    const remainingQuota = Math.max(0, maxIssues - merged.length);
    const finalAIIssues = uniqueAIIssues.slice(0, remainingQuota);

    return [...merged, ...finalAIIssues];
  } catch (error) {
    core.setFailed(`Error during AI issue generation: ${error.message}`);
    return [];
  }
}

module.exports = {
  getAIIssues
};
