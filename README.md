# Awwesome

Enhanced user interface for [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)

Visit [awweso.me](https://awweso.me) for a demo

Original data by the <a href="https://github.com/awesome-selfhosted/awesome-selfhosted-data">awesome-selfhosted</a> community, licensed under <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA 3.0</a>

<img width="1586" alt="awwesome_screenshot" src="https://github.com/mkitzmann/awwesome/assets/35574021/a7ce063c-681e-49b3-9abe-3a5086151271">

## Technology

This projects uses Svelte and Tailwind.

The projects are crawled from [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) and then additional data is fetched from GitHubs GraphQL API.


## Personal Access Token

You will need a personal access token from Github to be able to use the GraphQL API.
More information on this can be found under ["Managing your personal access tokens"](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

It is recommended to use a fine-grained personal access token without any access rights. This is possible because fine-grained personal access have access to public repos per default. 

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

## Production

It is recommended to statically generate Awwesome instead of server render the site, because the GraphQL queries can take long and therefore reduce the user experience.

```bash
# generate a static build
npm run build

# preview the generated build in a local webserver
npm run preview
```

