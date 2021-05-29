const server = require('./server');
const ds = server.dataSources.db;
const lbTables = ["face", "person", "social_network", "history"];
ds.automigrate(lbTables, function (er) {
  if (er) throw er;
  console.log('Loopback tables [' - lbTables - '] created in ', ds.adapter.name);
  ds.disconnect();
});
