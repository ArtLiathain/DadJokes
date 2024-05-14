CREATE TABLE fileStorage (
    filename VARCHAR(255),
    publickey VARCHAR(255),
    sharedSecret int,
    PRIMARY KEY (filename),
    FOREIGN KEY (publickey) REFERENCES users(publickey)
)