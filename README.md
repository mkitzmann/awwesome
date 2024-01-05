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

## Docker

Awwesome can be deployed using Docker and docker compose using this docker-compose.yml:

```
version: '3'
services:
  ofelia:
    image: mcuadros/ofelia:latest
    container_name: ofelia
    depends_on:
      - source
    command: daemon --docker
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      ofelia.job-run.awwesome.schedule: "@daily"
      ofelia.job-run.awwesome.container: "awwesome"
  source:
    image: mkitzmann/awwesome
    container_name: awwesome
    working_dir: /usr/src/app
    environment:
      TOKEN_GITHUB: ${TOKEN_GITHUB}
    command: sh -c "npm run build && rm -r html/* && cp -r dist/* html && exit"
    volumes:
      - shared_volume:/usr/src/app/html
  web:
    image: nginx
    container_name: nginx
    ports:
      - "8080:80"
    volumes:
      - shared_volume:/usr/share/nginx/html:ro
volumes:
  shared_volume:
```

This will generate the static website daily using [ofelia](https://github.com/mcuadros/ofelia).
The website is served by an nginx server which is mapped to port 8080 on the host computer.

The environment variable TOKEN_GITHUB needs to be provided (see [Personal Access Token](#personal-access-token)).
