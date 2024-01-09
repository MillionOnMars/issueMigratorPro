# IssueMigratorPro (IMP) - Erik Bethke 2024
Issue Migrator Pro is a very well equipped script to move and close issues in GitHub repos - very handy when you are splitting up repos and projects

                      
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

IMP is designed to seamlessly manage and migrate GitHub issues across different repositories
within the same organization. It enables easy transfer and closing of issues, with support for 
label-specific operations. The script runs in dry-run mode by default to preview actions 
without applying changes. Use the 'live' flag to execute actions.

### MIT License - Party!

# Create a .gitignore
- ```*.js```
- ```.env``` DO NOT CHECK IN YOUR PAT KEY TO GITHUB
- ```node_modules```

## Setup your .env
1. Create a .env file in the same directory
- ```GITHUB_ORG=<YourOrgInQuotes>``` Your org - you will need to be able to get a PAT key with repo access
- ```GITHUB_TOKEN=<YourPATKey>``` Go to GitHub | Profile | Settings | Developer Settings | PAT Key


## Building
- ```npm install -g typescript``` If you have not yet installed the typescript compiler
- ```npm i axios dotenv``` To install the two imported libraries
- ```npm i --save-dev @types/node``` To setup the typescript types
- ```tsc issueissueMigratorPro``` To do the actual build

## To Run
- ```node issueissueMigratorPro from:<fromRepo> target:<toRepo> <create|purge> <live>```

### Optional
- ```npm install -g ts-node``` If you would like to just run with:
- ```ts-node issueMigratorPro from:<fromRepo> target:<toRepo> <create|purge> <live>```
- instead of doing it as two steps (tsc and node)
