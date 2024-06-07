# cosmosc2-tool-planetviewer

This plugin provides the Cosmos v5 with an integrated Cesium viewer. The user can visualize data on the globe in realtime or rewatch a time with data pulled from Cosmos. The user can also load czml files and add static points or dynamic points.

![demo.png](demo.png)

## Building

```sh
yarn
#
yarn build
#
rake build VERSION=5.0.X
```

## Upgrading to docker compose v2

```sh
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r '.tag_name')

DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
```
