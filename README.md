# DadJokes

Q: Why did the functions stop calling each other?

A: Because they had constant arguments.

### Team Members:

Dominick Stephens - 22343288
Art O'Liathain - 22363092
Darragh Grealish - 22347666

### Overview
This project is to design and implement a secure, end-to-end encrypted file-sharing app using a client-server architecture.

### Algorithms Used:
Argon2id for password hashing


AES-256-GCM for file encryption


### Dependencies:
npm i (from package.json)


### How To Run:

#### MySQL Setup:

CREATE USER 'sqluser'@'%' IDENTIFIED WITH mysql_native_password BY 'password';


GRANT ALL PRIVILEGES ON . TO 'sqluser'@'%';


FLUSH PRIVILEGES;

CREATE DATABASE dadjokes;

mysql -u sqluser -p dadjokes < ./SqlFiles/testdatabase.sql

#### Run Command:

npm run dev
