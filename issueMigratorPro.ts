/**
 * IssueMigratorPro (IMP) - Erik Bethke 2024
                      
██╗███╗   ███╗██████╗       ,      ,
██║████╗ ████║██╔══██╗     /(.-""-.)\
██║██╔████╔██║██████╔╝ |\  \/      \/  /|
██║██║╚██╔╝██║██╔═══╝  | \ / =.  .= \ / |
██║██║ ╚═╝ ██║██║      \( \   o\/o   / )/
╚═╝╚═╝     ╚═╝╚═╝       \_, '-/  \-' ,_/
                          /   \__/   \
                         \,___/\___,/
                       ___\ \|--|/ /___
                     /`    \      /    `\
                    /       '----'       \

 * IMP is designed to seamlessly manage and migrate GitHub issues across different repositories
 * within the same organization. It enables easy transfer and closing of issues, with support for 
 * label-specific operations. The script runs in dry-run mode by default to preview actions 
 * without applying changes. Use the 'live' flag to execute actions.
 * 
 * Usage:
 * 
 * 1. Purge Issues (Dry Run by default):
 *    - To preview closing all issues in a specific repository:
 *      node script.js purge target:<targetRepo>
 *    - To actually close all issues:
 *      node script.js purge target:<targetRepo> live
 *    - To preview closing issues with a specific label:
 *      node script.js purge target:<targetRepo> <label>
 *    - To actually close issues with a specific label:
 *      node script.js purge target:<targetRepo> <label> live
 * 
 * 2. Transfer Issues (Dry Run by default):
 *    - To preview transferring all issues from one repo to another:
 *      node script.js from:<fromRepo> target:<targetRepo> transfer
 *    - To actually transfer all issues:
 *      node script.js from:<fromRepo> target:<targetRepo> transfer live
 *    - To preview transferring issues with a specific label:
 *      node script.js from:<fromRepo> target:<targetRepo> <label> transfer
 *    - To actually transfer issues with a specific label:
 *      node script.js from:<fromRepo> target:<targetRepo> <label> transfer live
 * 
 * Environment Variables:
 *    - GITHUB_TOKEN: Personal access token for GitHub API authentication.
 *    - GITHUB_ORG: The GitHub organization name under which the repositories exist.
 * 
 * Note:
 *    - IMP uses the GitHub REST API and requires internet connectivity.
 *    - Ensure the provided GitHub token has the necessary permissions.
 *    - The script includes a delay between actions to comply with GitHub's rate limits.
 * 
 * Examples:
 *    - node script.js purge target:myRepo live
 *    - node script.js from:sourceRepo target:destRepo bug transfer
 *    - node script.js from:sourceRepo target:destRepo transfer live
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const githubToken = process.env.GITHUB_TOKEN;
const org = process.env.GITHUB_ORG;
const headers = {
  Authorization: `token ${githubToken}`,
  Accept: 'application/vnd.github.v3+json',
};

interface CommandOptions {
  command: 'purge' | 'transfer';
  fromRepo?: string;
  targetRepo?: string;
  notLabel?: string;
  label?: string;
  live: boolean;
}

const handleError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`Error: ${error.message}`);
    console.error(`Status: ${error.response.status}`);
    console.error(`Data: ${error.response.data.message}`);
    // console.error(`Headers: ${error.response.headers}`);
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`Error: ${error.message}`);
    console.error('The request was made but no response was received');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error:', error.message);
  }
  process.exit(1);
};

// Similar changes to be applied to other functions with try-catch blocks

const parseArguments = (args: string[]): CommandOptions => {
  const options: CommandOptions = { command: 'transfer', live: false }; // Default to transfer and not live
  args.forEach(arg => {
    if (arg.startsWith('not:')) {
      options.notLabel = arg.split(':')[1];
    } else if (arg === 'live') {
      options.live = true;
    } else if (arg.includes('from:')) {
      options.fromRepo = arg.split(':')[1];
    } else if (arg.includes('target:')) {
      options.targetRepo = arg.split(':')[1];
    } else if (arg === 'transfer') {
      options.command = 'transfer';
    } else if (arg === 'purge') {
      options.command = 'purge';
    } else {
      options.label = arg;
    }
  });
  return options;
};

const options = parseArguments(process.argv.slice(2));

interface GithubIssue {
  id: number;
  title: string;
  number: number;
  body: string;
  assignees: { login: string }[];
  labels: { name: string }[];
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const closeIssue = async (issueNumber: number, repo: string) => {
  try {
    console.log(`Closing issue number: ${issueNumber} from ${repo}`);
    axios.patch(
      `https://api.github.com/repos/${org}/${repo}/issues/${issueNumber}`,
      {
        state: 'closed',
      },
      { headers }
    );
  } catch (error) {
    console.error('Error deleting issue:');
    handleError(error);
    process.exit(1);
  }
};

const purgeIssues = async (live: boolean) => {
  if (!options.targetRepo) {
    console.error('Target repository is not specified.');
    process.exit(1);
  }

  const issues = await getIssues(options.targetRepo, options.label, options.notLabel);

  for (const issue of issues) {
    if (!live) {
      console.log(`[Dry Run] Would purge issue: ${issue.title} (#${issue.number}) in ${options.targetRepo}`);
    } else {
      await closeIssue(issue.number, options.targetRepo); // Assuming the 'number' field is the issue number in GitHub
      await sleep(1000); // Sleep to avoid rate limiting
    }
  }
};

const getIssues = async (repo: string, label?: string, notLabel?: string) => {
  let allIssues: GithubIssue[] = []; // Explicitly typed as an array of GithubIssue
  let page = 1;
  const perPage = 100; // Max value is 100
  let queryString = `state=open&per_page=${perPage}`;

  if (label) {
    queryString += `&labels=${encodeURIComponent(label)}`; // Add label to the query string
  }

  try {
    while (true) {
      const response = await axios.get(
        `https://api.github.com/repos/${org}/${repo}/issues?${queryString}&page=${page}`,
        { headers }
      );

      allIssues = [...allIssues, ...response.data];

      if (response.data.length < perPage) {
        break; // Break the loop if we got the last page
      }

      page++; // Increment the page number to fetch the next page
    }

    // Filter out issues with notLabel
    if (notLabel) {
      allIssues = allIssues.filter(issue => !issue.labels.some(label => label.name === notLabel));
    }

    return allIssues;
  } catch (error) {
    console.error('Error getting issues:');
    handleError(error);
    process.exit(1);
  }
};

const createIssue = async (title: string, body: string, repo: string, labels: string[], assignees: string[]) => {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${org}/${repo}/issues`,
      { title, body, labels, assignees },
      { headers }
    );
    console.log('Created issue:', response.data.url);
  } catch (error) {
    console.error('Error creating issue:');
    handleError(error);
    process.exit(1);
  }
};

const transferIssues = async (live: boolean) => {
  if (!options.fromRepo || !options.targetRepo) {
    console.error('Source or target repository is not specified.');
    process.exit(1);
  }

  const issues = await getIssues(options.fromRepo, options.label, options.notLabel);

  if (!live) {
    console.log('[Dry Run], not creating issues');
    for (const issue of issues) {
      console.log(`[Dry Run] Creating issue: ${issue.title} in ${options.targetRepo}`);
    }
    return;
  } else {
    for (const issue of issues) {
      const labelNames = issue.labels.map(label => label.name); // Extract the label names
      const assigneeLogins = issue.assignees.map(assignee => assignee.login);
      console.log(`Creating issue: ${issue.title} in ${options.targetRepo}`);
      await createIssue(issue.title, issue.body, options.targetRepo, labelNames, assigneeLogins);
      await sleep(1000); // Sleep to avoid rate limiting
      console.log(`Deleting issue: ${issue.title} in ${options.fromRepo}`);
      await closeIssue(issue.number, options.fromRepo);
      await sleep(1000); // Sleep to avoid rate limiting
    }
  }
};

// Main execution logic
switch (options.command) {
  case 'purge':
    purgeIssues(options.live);
    break;
  case 'transfer':
    transferIssues(options.live);
    break;
  default:
    console.log('Missing commandL Choose purge or transfer');
    break;
}
