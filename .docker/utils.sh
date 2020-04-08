#!/usr/bin/env bash

# Get version on package.json file. 
get-project-version() {
  cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]'
}

run-and-exit-on-error() {
  command=$@

  eval $command
  RESULT=$?

  if [ $RESULT -ne 0 ]
  then
    echo "FAILURE IN: $command"
    exit $RESULT
  fi
}

docker-login() {
  run-and-exit-on-error echo "$DOCKER_PASSWORD" | docker login --username $DOCKER_USERNAME --password-stdin $REGISTRY_HOST
}

docker-logout() {
  run-and-exit-on-error docker logout $REGISTRY_HOST
}

tag-new-image() {
  FROM_IMAGE=$REGISTRY_HOST/$REGISTRY_PROJECT/$REGISTRY_NAME:$FROM_TAG
  TO_IMAGE=$REGISTRY_HOST/$REGISTRY_PROJECT/$REGISTRY_NAME:$TO_TAG

  echo -n -e "[PULL]\t$FROM_IMAGE\t"
  run-and-exit-on-error docker pull $FROM_IMAGE > /dev/null 2>&1
  echo -e "${GREEN}OK${NC}!"

  echo -n -e "[TAG]\t$TO_IMAGE\t"
  run-and-exit-on-error docker tag $FROM_IMAGE $TO_IMAGE > /dev/null 2>&1
  echo -e "${GREEN}OK${NC}!"

  echo -n -e "[PUSH]\t$TO_IMAGE\t"
  run-and-exit-on-error docker push $TO_IMAGE > /dev/null 2>&1
  echo -e "${GREEN}OK${NC}!"
}
