# Coolify Action

## Introduction to Coolify

[Coolify](https://coolify.io) is a self-hostable, all-in-one solution to host your applications, databases, or other open-source services with a few simple clicks.

It's an alternative software to [Heroku](https://www.heroku.com/) and [Netlify](https://www.netlify.com/) and other alternatives out there.

You can try it out before installing it: [Live demo](https://demo.coolify.io/)


## Inputs
| Name              | Required                      | Description                                                                       |
|-------------------|:-----------------------------:|-----------------------------------------------------------------------------------|
| coolify-url       |    <ul><li>- [x] </li></ol>   | Url of your coolify. Ex. https://coolify.com || http://131.212.31.123:3000        |
| coolify-app-id    |    <ul><li>- [x] </li></ol>   | Application id                                                                    |
| coolify-token     |    <ul><li>- [x] </li></ol>   | Bearer token base                                                                 |


## How To Use

### Disable feature Automatic Deployment in Coolify Application

## Github Actions

- This is a complete .github/workflows/deploy.yml example.
Set the coolify-url and coolify-app-id you found above.

```yml
name: deploy project
on: [pull_request]

jobs:
  deploy:
    name: Deploy to Coolify
    runs-on: ubuntu-20.04
    environment: manicmade.com
    steps:
      - uses: manicmade/coolify-actions@v0.0.1
        with:
          coolify-url: ${{ secrets.COOLIFY_URL }}
          coolify-app-id: ${{ secrets.COOLIFY_APP_ID }}
          coolify-token: ${{ secrets.COOLIFY_TOKEN }}
```