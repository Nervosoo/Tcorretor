FROM node:24-alpine

WORKDIR /app

COPY apps/api/package.json ./package.json
RUN npm install

COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
