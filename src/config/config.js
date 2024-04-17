import dotenv from 'dotenv';
import { Command } from 'commander';

const program = new Command(); 

program
    .option('-d', 'Variable para debug', false)
    .option('--persist <persist>', 'Modo de persistencia', "mongodb")
    .option('--mode <mode>', 'Modo de trabajo', 'dev')
program.parse();

//console.log("Options: ", program.opts());
console.log("Environment Mode Option: ", program.opts().mode);
console.log("Persistence Mode Option: ", program.opts().persist);

const environment = program.opts().mode;

let envPath = "./src/config/.env.development";
if (program.opts().mode === "prod") {
    envPath = "./src/config/.env.production";
} else if (program.opts().mode === "testing") {
    envPath = "./src/config/.env.testing";
}

dotenv.config({
    path: envPath
});

console.log("PERSISTENCE:::");
console.log(program.opts().persist);
// dotenv.config({
//     path: "./src/config/.env"
// });

export default {
    port: process.env.PORT,
    mongoUrl: process.env.MONGO_URL,
    sessionSecret: process.env.SESSION_SECRET,
    persistance: program.opts().persist,
    adminName: process.env.AMIN_NAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    gmailAccount: process.env.GMAIL_ACCOUNT,
    gmailAppPassword: process.env.GMAIL_APP_PASSWD,
    environment:  program.opts().mode
};
