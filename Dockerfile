FROM docker.io/r30b/pyno

WORKDIR /app

COPY package.json requirements.txt ./

RUN npm install && pip install -r requirements.txt

COPY . .

RUN npm run postbuild && rm -r frontend/node_modules

#EXPOSE 4000

CMD node backend/server.js