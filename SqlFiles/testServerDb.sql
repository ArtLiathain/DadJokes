CREATE TABLE users (
    publickey INT,
    username VARCHAR(255),
    password VARCHAR(255),
    PRIMARY KEY (publickey)
) ENGINE=InnoDB;

CREATE TABLE fileStorage (
    filename VARCHAR(255),
    topublickey INT,
    frompublickey INT,
    PRIMARY KEY (filename),
    FOREIGN KEY (topublickey) REFERENCES users(publickey),
    FOREIGN KEY (frompublickey) REFERENCES users(publickey)
) ENGINE=InnoDB;
 