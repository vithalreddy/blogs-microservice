FROM node:latest

COPY . /src

WORKDIR /src

RUN npm install --production --quiet

EXPOSE 9002

CMD npm start