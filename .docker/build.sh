#!/usr/bin/env bash
. "$(pwd)/$(dirname $0)/utils.sh"

# Expected ENV variables
# Mandatory:
# DOCKER_USERNAME
# DOCKER_PASSWORD
# REGISTRY_HOST     example: domatica.no-ip.org:1080 
# REGISTRY_PROJECT  example: cloud
# REGISTRY_NAME     example: cloud-headoffice-web
#
# Optional:
# REPOSITORY_TAG    default: latest   [ PR | latest | staging | stable | ... ]
# COMMAND           default: publish  [ publish | build ]

# Check if all necessary ENV variables are defined!
if [ -z $DOCKER_USERNAME ] || [ -z $DOCKER_PASSWORD ] || [ -z $REGISTRY_HOST ] || [ -z $REGISTRY_PROJECT ] || [ -z $REGISTRY_NAME ]
then
  echo "ERROR: Environment variables missing! Please supply: \$DOCKER_USERNAME, \$DOCKER_PASSWORD, \$REGISTRY_HOST, \$REGISTRY_PROJECT, \$REGISTRY_NAME."
  exit 1
fi

# Set default values
PROJECT_VERSION=$(get-project-version)

if [ -z $REPOSITORY_TAG ]
then
  REPOSITORY_TAG="latest"
fi

if [ -z $COMMAND ]
then
  COMMAND="publish"
fi

# Local variables
LOCAL_PATH="$(pwd)/$(dirname $0)"
ROOT_PATH="$(dirname $LOCAL_PATH)"
DOCKER_REPOSITORY_NAME="${REGISTRY_HOST}/${REGISTRY_PROJECT}/${REGISTRY_NAME}"
DOCKER_IMAGE_NAME="${DOCKER_REPOSITORY_NAME}:${PROJECT_VERSION}"
DOCKER_IMAGE_TAG="${DOCKER_REPOSITORY_NAME}:$REPOSITORY_TAG"

# Build docker image
echo "Building image: ${DOCKER_IMAGE_NAME}"
run-and-exit-on-error docker build \
  --file docker/build/Dockerfile \
  --target ${COMMAND}Stage \
  --tag ${DOCKER_IMAGE_NAME} \
  ${ROOT_PATH}


# Publish docker image
if [ ${COMMAND} == "publish" ]
then

  # Start by logging in
  docker-login

  echo "Tagging image: $DOCKER_IMAGE_NAME with TAG: $DOCKER_IMAGE_TAG"
  run-and-exit-on-error docker image tag $DOCKER_IMAGE_NAME $DOCKER_IMAGE_TAG

  echo "Publishing image: $DOCKER_IMAGE_TAG"
  run-and-exit-on-error docker push $DOCKER_IMAGE_TAG

  # Terminate by logging out
  docker-logout

fi
