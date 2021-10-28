const { Pool } = require('pg');

const { DB } = require('./../config');

class Database {
  constructor(config) {
    this.pool = new Pool(config || DB);
  }

  query(query, params) {
    return new Promise((resolve, reject) => this.pool.query(query, params, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    }));
  }
}

module.exports = { Database, database: new Database() };
