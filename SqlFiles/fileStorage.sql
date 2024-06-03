CREATE TABLE fileStorage (
    filename VARCHAR(255),
    topublickey INT,
    frompublickey INT,
    PRIMARY KEY (filename),
    FOREIGN KEY (topublickey) REFERENCES users(publickey),
    FOREIGN KEY (frompublickey) REFERENCES users(publickey)
) ENGINE=InnoDB;
 