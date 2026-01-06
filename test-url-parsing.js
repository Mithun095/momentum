
const { parse } = require('url');

const urlString = "postgresql://postgres:mYth@095mom@db.ovoozbzqndsaedvkdwpk.supabase.co:5432/postgres";

try {
    const url = new URL(urlString);
    console.log("Protocol:", url.protocol);
    console.log("Username:", url.username);
    console.log("Password:", url.password);
    console.log("Hostname:", url.hostname);
    console.log("Port:", url.port);
    console.log("Pathname:", url.pathname);
} catch (e) {
    console.error("Parsing error:", e.message);
}
