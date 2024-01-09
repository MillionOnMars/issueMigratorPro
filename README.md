# issueMigratorPro
Issue Migrator Pro is a very well (typescript) script to move and close issues in GitHub repos - very handy when you are splitting up repos and projects

# MIT License - Party!

# Create a .gitignore
```*.js```
```.env``` DO NOT CHECK IN YOUR PAT KEY TO GITHUB
```node_modules```

## Setup your .env
1. Create a .env file in the same directory
```GITHUB_ORG=<YourOrgInQuotes>```
```GITHUB_TOKEN=<YourPATKey>```


## Building
```npm install -g typescript``` If you have not yet installed the typescript compiler
```npm i axios dotenv```
```npm i --save-dev @types/node```
To build
```tsc issueissueMigratorPro```

## To Run
```node issueissueMigratorPro```

### Optional
```npm install -g ts-node``` If you would like to just run with ```ts-node issueMigratorPro from:<from> target:<to> create```
instead of doing it as two steps:
