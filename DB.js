const mysql = require("mysql2");
const connectionData = require("./Secret.js");
const pool = mysql.createConnection(connectionData); // DB에 연결
const promisePool = pool.promise(); // 프로미스 풀로 업그레이드
// promise <= 비동기를 동기로 바꿈


async function Query(sql, data = []) {
    const [rows, field] = await promisePool.query(sql, data);
    return rows;
}

module.exports = {
    Query,
    Pool: promisePool
};