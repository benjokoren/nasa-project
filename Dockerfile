# important, remove from the package.json the lines with the npn-run-all, old node dosent know it:
# "install": "npm-run-all --parallel install-server install-client",

FROM node:16

WORKDIR /app

COPY package*.json ./

COPY client/package*.json client/
RUN npm run install-client --omit=dev

COPY server/package*.json server/
RUN npm run install-server --omit=dev

COPY client/ client/
RUN npm run client-build --prefix client

COPY server/ server/

USER node

CMD [ "npm", "start", "--prefix", "server" ]

EXPOSE 8000