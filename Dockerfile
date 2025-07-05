# dockerfile untuk membungkus aplikasi

# menggunakan base image nodejs
FROM node:20-alpine

# menentukan working directory
WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm ci

# copy source code ke working directory container
COPY . .

# generate skema
RUN npx prisma generate

# hanya kasih tahu docker (mendokumentasikan) bahwa container ini akan listen/buka di port 5001, 
# namun belum benar-benar membuka port ke luar container.
# yang akan membuka port-nya yaitu perlu mapping port di docker-compose.
# apakah harus sama dengan yang di .env? tidak harus tapi sangat direkomendasikan sama agar tidak misleading.
EXPOSE 5001

# saat container dijalankan, dia otomatis jalanin npm start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
