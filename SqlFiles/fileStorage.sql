CREATE TABLE fileStorage (
    filename VARCHAR(255),
    publickey VARCHAR(255),
    PRIMARY KEY (filename),
    FOREIGN KEY (publickey) REFERENCES users(publickey)
)