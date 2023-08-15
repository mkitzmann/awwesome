# Awwesome Selfhosted

Simple user interface for [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)

Visit [awweso.me](https://awweso.me) for a demo

## Technology

This projects uses Svelte and Tailwind.

The projects are crawled from [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) and then additional data is fetched from GitHubs GraphQL API.


## Personal Access Token

You will need a personal access token from Github to be able to use the GraphQL API.
More information on this can be found under ["Managing your personal access tokens"](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

The personal access token needs to be added to a .env file in the root directory.


```env
TOKEN_GITHUB=abcdefg.....
```

## Developing

Clone the repository, install the dependencies and start the development server:

```bash
npm install
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```
