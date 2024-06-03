CREATE TABLE users (
    publickey VARCHAR(255),
    username VARCHAR(255),
    password VARCHAR(255),
    PRIMARY KEY (publickey)
) ENGINE=InnoDB;

CREATE TABLE fileStorage (
    filename VARCHAR(255),
    topublickey VARCHAR(255),
    frompublickey VARCHAR(255),
    iv VARCHAR(255),
    authTag VARCHAR(255),
    sharedText VARCHAR(255),
    PRIMARY KEY (filename),
    FOREIGN KEY (topublickey) REFERENCES users(publickey),
    FOREIGN KEY (frompublickey) REFERENCES users(publickey)
) ENGINE=InnoDB;