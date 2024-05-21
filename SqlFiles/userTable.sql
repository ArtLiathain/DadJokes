CREATE TABLE users (
    publickey VARCHAR(255),
    username VARCHAR(255),
    password VARCHAR(255),
    salt VARCHAR(255),
    pepper VARCHAR(255),
    PRIMARY KEY (publickey)
)