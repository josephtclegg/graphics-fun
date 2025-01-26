FROM node:10-alpine
RUN mkdir -p /home/node/app/keys
RUN mkdir -p /home/node/app/node_modules
RUN mkdir -p /home/node/app/public && cd /home/node/app/public && wget "https://raw.githubusercontent.com/toji/gl-matrix/refs/heads/master/dist/gl-matrix-min.js" && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 443
CMD [ "node", "index.js" ]

