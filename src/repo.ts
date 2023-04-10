import sqlite3 from 'sqlite3';

export default class Repo {
	private db: sqlite3.Database

	constructor() {
		this.db = new (sqlite3.verbose()).Database('data.db', (err) => err ? console.log(err.message) : null)
	}

	createTable(name: string, params: string) {
		this.db.serialize(() => {
			this.db.run(`CREATE TABLE IF NOT EXISTS ${name} (${params})`)
		})
		this.db.close()
	}
	removeTable(name: string) {
		this.db.serialize(() => {
			this.db.run(`DROP TABLE IF EXISTS ${name}`)
		})
		this.db.close()
	}
	addValue(table: string, field: string, value: string) {
		this.db.serialize(() => {
			this.db.run(`INSERT INTO ${table}(${field}) VALUES (${value})`)
		})
		this.db.close()
	}
	getValue(table: string, value: string) {
		let result: any;
		this.db.serialize(() => {
			this.db.get(`SELECT ${value} FROM ${table}`, (err, row) => result = row)
		})
		this.db.close()
		return result
	}
	removeValue(table: string, value: string) {
		this.db.serialize(() => {
			this.db.run(`DELETE FROM ${table} WHERE ${value}`)
		})
		this.db.close()
	}
}