#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { input } from '@inquirer/prompts';
import Conf from 'conf';
import { PalDefenderClient } from 'paldefender-rest-client';

declare const APP_VERSION: string;

const config = new Conf({ projectName: 'pd-cli' });
const version = APP_VERSION;
const program = new Command();

const _B = "QWRtaW4gVXRpbGl0eSBieSBHbGl0Y2hBcG90YW11cw==";
const getAuthor = () => Buffer.from(_B, 'base64').toString();

const _CHECK = "HbGlitchApotamus";

function validateIntegrity() {
    const brand = getAuthor();
    if (!brand.includes("GlitchApotamus") || brand.length < 10) {
        console.error(chalk.red.bold("\n🚨 INTEGRITY ERROR: This binary has been tampered with and is no longer functional."));
        process.exit(1);
    }
}

function getClient() {
    validateIntegrity();
    const token = config.get('token') as string;
    const host = config.get('host') as string;
    const port = config.get('port') as string;
    return new PalDefenderClient({token, host, port: parseInt(port)});
}

program
    .name('pd-cli')
    .description('PalDefender Management CLI')
    .version(version);

const splashText = `
${chalk.cyan.bold('██████╗ ██████╗       ██████╗██╗     ██╗')}
${chalk.cyan.bold('██╔══██╗██╔══██╗     ██╔════╝██║     ██║')}
${chalk.cyan.bold('██████╔╝██║  ██║     ██║     ██║     ██║')}
${chalk.cyan.bold('██╔═══╝ ██║  ██║     ██║     ██║     ██║')}
${chalk.cyan.bold('██║     ██████╔╝     ╚██████╗███████╗██║')}
${chalk.cyan.bold('╚═╝     ╚═════╝       ╚═════╝╚══════╝╚═╝')}

      ${chalk.grey(getAuthor())}
`;

program.addHelpText('before', boxen(splashText, {
    padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan',
    title: `PD-CLI v${version}`, titleAlignment: 'center'
}));

program
    .command('configure')
    .description('Interactively save your server connection details')
    .action(async () => {
        console.log(chalk.cyan('\n⚙️  Global Configuration Setup\n'));

        const token = await input({
            message: 'Enter your PalDefender Admin Token:',
            default: (config.get('token') as string) || process.env.PD_TOKEN || "0"
        });

        const host = await input({
            message: 'Enter Server Host/IP:',
            default: (config.get('host') as string) || process.env.PD_HOST || '127.0.0.1'
        });

        const port = await input({
            message: 'Enter Server Port:',
            default: (config.get('port') as string) || process.env.PD_PORT || '8212'
        });

        config.set('token', token);
        config.set('host', host);
        config.set('port', port);

        console.log(chalk.green('\n✔ Configuration saved successfully!'));
        console.log(chalk.grey(`Stored at: ${config.path}\n`));
    });
// --- Configuration Management ---
program
    .command('clear-config')
    .description('Remove all saved server connection details')
    .action(() => {
        const spinner = ora('Clearing local configuration...').start();
        try {
            config.clear(); // 
            spinner.succeed(chalk.green('Local configuration wiped successfully.'));
            console.log(chalk.grey('You will need to run "pd-cli configure" before making new requests.'));
        } catch (error: any) {
            spinner.fail(chalk.red('Failed to clear configuration.'));
            console.error(chalk.white(error.message));
        }
    });
// --- Connection Health Check ---
program
    .command('test-connection')
    .description('Verify server connectivity and authentication token')
    .action(async () => {
        const spinner = ora({
            text: chalk.blue('Verifying connection to PalDefender...'),
            color: 'cyan'
        }).start();

        try {
            const testClient = getClient();
            const ver = await testClient.version();

            // Case 1: 200 OK - Everything is perfect
            spinner.succeed(chalk.green('Connection Successful! (Authenticated)'));

            console.log(boxen(
                `${chalk.white.bold('PalDefender Version:')} ${chalk.cyan(ver.version_str_long)}\n` +
                `${chalk.white.bold('Target:')} ${chalk.grey(config.get('host') + ':' + config.get('port'))}`,
                { padding: 1, borderStyle: 'single', borderColor: 'green' }
            ));

        } catch (error: any) {
            // Check if it's a 401 Unauthorized
            if (error.message.includes('401')) {
                // Case 2: 401 Unauthorized - Connection works, but token is bad
                spinner.warn(chalk.yellow('Connection Successful! (Unauthorized)'));

                console.log(boxen(
                    `${chalk.red.bold('⚠ Authentication Failed')}\n\n` +
                    `${chalk.white('The server is reachable at ')}${chalk.cyan(config.get('host'))}${chalk.white(', but your token is invalid.')}\n\n` +
                    `${chalk.yellow('👉 Run "pd-cli configure" to update your credentials.')}`,
                    { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
                ));
            } else {
                // Case 3: Any other error (Server down, Timeout, 500, etc.)
                spinner.fail(chalk.red('Connection Failed!'));
                console.error(chalk.red.bold('\n✖ Error:'), chalk.white(error.message));
                console.error(chalk.yellow('\n👉 Ensure your PalDefender server is running and the Host/Port are correct.'));
            }
        }
        // No need for spinner.stop() here as succeed/warn/fail handles it
    });
// --- Dynamic Library Commands ---
function getParamNames(func: Function): string[] {
    const fnStr = func.toString();
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    return result === null ? [] : result;
}

const methods = Object.getOwnPropertyNames(PalDefenderClient.prototype);

methods.forEach((methodName) => {
    // Skip constructor and internal helper methods
    if (methodName === 'constructor' || methodName.startsWith('_')) return;

    // Use the prototype to discover parameters without instantiating the client yet
    const prototypeMethod = (PalDefenderClient.prototype as any)[methodName];

    if (typeof prototypeMethod === 'function') {
        const cmd = program.command(methodName);
        const params = getParamNames(prototypeMethod);

        // Map method arguments to CLI arguments
        params.forEach(param => {
            cmd.argument(`<${param}>`, `Parameter: ${param}`);
        });

        cmd.description(`Execute ${methodName} via API`)
            .action(async (...args) => {
                // Initialize the client ONLY when the command is called [cite: 317]
                const client = getClient();
                const method = (client as any)[methodName];

                // The last argument is always the command object itself
                const rawArgs = args.slice(0, args.length - 1);

                // Basic validation for missing arguments
                if (rawArgs.length < method.length) {
                    console.error(chalk.yellow(`\n⚠️  Missing Arguments!`));
                    console.error(chalk.white(`   ${methodName} requires ${method.length} arguments.\n`));
                    console.log(cmd.helpInformation());
                    return;
                }

                // Handle JSON inputs for complex types like ItemInput or GiveItem[]
                const processedArgs = rawArgs.map(arg => {
                    if (typeof arg === 'string' && (arg.startsWith('[') || arg.startsWith('{'))) {
                        try { return JSON.parse(arg); } catch { return arg; }
                    }
                    return arg;
                });

                const spinner = ora({
                    text: chalk.blue(`Requesting ${methodName}...`),
                    color: 'cyan'
                }).start();

                try {
                    const result = await method.apply(client, processedArgs);
                    spinner.succeed(chalk.green(`API Success: ${methodName}`));

                    console.log(boxen(JSON.stringify(result, null, 2), {
                        padding: 0.5, borderColor: 'green', dimBorder: true
                    }));

                } catch (error: any) {
                    spinner.fail(chalk.red(`API Failure: ${methodName}`));
                    console.error(chalk.red.bold(`\n✖ Error:`), chalk.white(error.message));

                    if (error.message.includes('401')) {
                        console.error(chalk.yellow('👉 Run "pd-cli configure" to update your credentials.'));
                    }
                }
            });
    }
});

export default program;