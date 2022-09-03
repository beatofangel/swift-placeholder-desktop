import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'

sqlite3.verbose()
// you would have to import / invoke this in another file
export async function openDb () {
  return open({
    filename: 'database/userdata.db',
    // filename: path.join(__dirname, 'database/userdata.db'),
    driver: sqlite3.Database
  })
}