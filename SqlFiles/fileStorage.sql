CREATE TABLE fileStorage (
    filename VARCHAR(255),
    topublickey VARCHAR(255),
    frompublickey VARCHAR(255),
    iv VARCHAR(255),

    PRIMARY KEY (filename),
    FOREIGN KEY (topublickey) REFERENCES users(publickey),
    FOREIGN KEY (frompublickey) REFERENCES users(publickey)
) ENGINE=InnoDB;
 