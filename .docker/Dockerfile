# BUILD stage.
FROM node:11.15-alpine as buildStage

WORKDIR /app

# Copy only relevant files and install dependencies.
COPY package.json package-lock.json ./
RUN npm install

# Copy all local files into the image. # src/ src/ maybe?
COPY . .

# Build the project.
RUN npm run build


# PUBLISH stage.
FROM node:11.15-alpine as publishStage

COPY --from=buildStage /app/dist         /app
COPY --from=buildStage /app/node_modules /app/node_modules

CMD ["node", "/app/main.js"]
