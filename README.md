# Awwesome

[![Docker Hub](https://img.shields.io/docker/v/mkitzmann/awwesome?label=Docker%20Hub&sort=semver)](https://hub.docker.com/r/mkitzmann/awwesome)
[![GitHub Release](https://img.shields.io/github/v/release/mkitzmann/awwesome)](https://github.com/mkitzmann/awwesome/releases)
[![License](https://img.shields.io/github/license/mkitzmann/awwesome)](LICENSE)

Enhanced user interface for [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted).

Visit [awweso.me](https://awweso.me) for the live version.

Original data by the [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted-data) community, licensed under [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

<img width="1586" alt="awwesome_screenshot" src="https://github.com/mkitzmann/awwesome/assets/awwesome-screenshot.jpeg">

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) / [Svelte 5](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team/)
- [GitHub GraphQL API](https://docs.github.com/en/graphql) for project metadata

## Docker

Awwesome is available on [Docker Hub](https://hub.docker.com/r/mkitzmann/awwesome).

```bash
docker run -p 3000:3000 -v awwesome_data:/usr/src/app/data mkitzmann/awwesome
```

Or using docker compose:

```yaml
services:
  awwesome:
    image: mkitzmann/awwesome:latest
    ports:
      - '3000:3000'
    environment:
      - TOKEN_GITHUB=${TOKEN_GITHUB} # optional, for star history
    volumes:
      - data:/usr/src/app/data

volumes:
  data:
```

The container runs a Node.js server on port 3000. The data volume persists the SQLite database across restarts.

## Development

Clone the repository with submodules:

```bash
git clone --recurse-submodules https://github.com/mkitzmann/awwesome.git
cd awwesome
```

Install dependencies and seed the database:

```bash
yarn install
yarn seed
```

Optionally, fetch GitHub star history (requires a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with no extra permissions):

```bash
echo "TOKEN_GITHUB=your_token_here" > .env
yarn backfill-stars
```

Start the development server:

```bash
yarn dev
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[BSD 3-Clause](LICENSE)
