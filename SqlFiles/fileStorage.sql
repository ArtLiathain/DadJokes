CREATE TABLE fileStorage (
    filename VARCHAR(255),
    topublickey VARCHAR(255),
    frompublickey VARCHAR(255),
    PRIMARY KEY (filename),
    FOREIGN KEY (publickey) REFERENCES users(publickey)
)
