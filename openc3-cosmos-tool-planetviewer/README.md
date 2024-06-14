# openc3-cosmos-tool-planetviewer

This plugin provides the OpenC3 COSMOS PlanetViewer Tool

## Upgrading to docker compose v2

```sh
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r '.tag_name')

DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
```

## Getting Started

Yarn and cesium are not working so make sure to nohoist the cesium package

package.json

```json
  "workspaces": {
    "packages": [
      "packages/*"
    ],
    "nohoist": [
      "**/tool-planetviewer/cesium"
    ]
  },
```

## Building in the openc3/cosmos/openc3-cosmos-init dir

to test internal to openc3-cosmos you can update `openc3-cosmos-init/Dockerfile`

```diff
diff --git a/openc3-cosmos-init/Dockerfile b/openc3-cosmos-init/Dockerfile
index 3738aba24..ebc3f2b12 100644
--- a/openc3-cosmos-init/Dockerfile
+++ b/openc3-cosmos-init/Dockerfile
@@ -25,6 +25,7 @@ COPY ./plugins/packages/openc3-cosmos-tool-iframe/*.json packages/openc3-cosmos-
 COPY ./plugins/packages/openc3-cosmos-tool-handbooks/*.json packages/openc3-cosmos-tool-handbooks/
 COPY ./plugins/packages/openc3-cosmos-tool-limitsmonitor/*.json packages/openc3-cosmos-tool-limitsmonitor/
 COPY ./plugins/packages/openc3-cosmos-tool-packetviewer/*.json packages/openc3-cosmos-tool-packetviewer/
+COPY ./plugins/packages/openc3-cosmos-tool-planetviewer/*.json packages/openc3-cosmos-tool-planetviewer/
 COPY ./plugins/packages/openc3-cosmos-tool-scriptrunner/*.json packages/openc3-cosmos-tool-scriptrunner/
 COPY ./plugins/packages/openc3-cosmos-tool-tablemanager/*.json packages/openc3-cosmos-tool-tablemanager/
 COPY ./plugins/packages/openc3-cosmos-tool-tlmgrapher/*.json packages/openc3-cosmos-tool-tlmgrapher/
@@ -89,6 +90,10 @@ FROM openc3-frontend-tmp AS openc3-tmp3
 COPY ./plugins/packages/openc3-cosmos-tool-packetviewer/ packages/openc3-cosmos-tool-packetviewer/
 RUN ["/openc3/plugins/docker-package-build.sh", "openc3-cosmos-tool-packetviewer"]
 
+# Build planetviewer tool
+COPY ./plugins/packages/openc3-cosmos-tool-planetviewer/ packages/openc3-cosmos-tool-planetviewer/
+RUN ["/openc3/plugins/docker-package-build.sh", "openc3-cosmos-tool-planetviewer"]
+
 # Build tlmgrapher tool
 FROM openc3-frontend-tmp AS openc3-tmp4
 COPY ./plugins/packages/openc3-cosmos-tool-tlmgrapher/ packages/openc3-cosmos-tool-tlmgrapher/
```

## init.sh

```diff
diff --git a/openc3-cosmos-init/init.sh b/openc3-cosmos-init/init.sh
index aab4448f2..d06602429 100755
--- a/openc3-cosmos-init/init.sh
+++ b/openc3-cosmos-init/init.sh
@@ -136,6 +136,9 @@ fi
 if [ -z $OPENC3_NO_PACKETVIEWER ]; then
     ruby /openc3/bin/openc3cli load /openc3/plugins/gems/openc3-cosmos-tool-packetviewer-*.gem || exit 1
 fi
+if [ -z $OPENC3_NO_PLANETVIEWER ]; then
+    ruby /openc3/bin/openc3cli load /openc3/plugins/gems/openc3-cosmos-tool-planetviewer-*.gem || exit 1
+fi
 if [ -z $OPENC3_NO_TLMVIEWER ]; then
     ruby /openc3/bin/openc3cli load /openc3/plugins/gems/openc3-cosmos-tool-tlmviewer-*.gem || exit 1
 fi
```

## use rsync

```sh
rsync -ru ../cosmosc2-tool-planetviewer/openc3-cosmos-tool-planetviewer/ openc3-cosmos-init/plugins/packages/openc3-cosmos-tool-planetviewer/
```
